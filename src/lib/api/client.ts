import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

import { PRODUCT_NAME } from '@/constants/branding';
import { API_BASE_URL } from '@/lib/api/config';
import type { ApiErrorBody, LoginResponse, RefreshResponse } from '@/lib/api/types';

const REFRESH_TOKEN_KEY = 'rip.mobile.refresh-token';
const DEVICE_ID_KEY = 'rip.mobile.device-id';
const REQUEST_TIMEOUT_MS = 20_000;
const EXPIRY_BUFFER_MS = 30_000;

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshPromise: Promise<boolean> | null = null;
let sessionInvalidatedHandler: (() => void) | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = `Unable to reach ${PRODUCT_NAME}. Check your connection and try again.`) {
    super(message);
    this.name = 'NetworkError';
  }
}

export function setSessionInvalidatedHandler(handler: (() => void) | null) {
  sessionInvalidatedHandler = handler;
}

function setAccessSession(session: Pick<LoginResponse, 'accessToken' | 'expiresIn'>) {
  accessToken = session.accessToken;
  accessTokenExpiresAt = Date.now() + session.expiresIn * 1000;
}

async function persistSession(session: LoginResponse | RefreshResponse) {
  setAccessSession(session);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function clearSession() {
  accessToken = null;
  accessTokenExpiresAt = 0;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function hasStoredSession(): Promise<boolean> {
  return Boolean(await SecureStore.getItemAsync(REFRESH_TOKEN_KEY));
}

async function getDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return id;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let body: (T & ApiErrorBody) | undefined;

  try {
    body = raw ? (JSON.parse(raw) as T & ApiErrorBody) : undefined;
  } catch {
    throw new ApiError(response.status, 'INVALID_RESPONSE', `${PRODUCT_NAME} returned an unexpected response.`);
  }

  if (!response.ok) {
    const error = body?.error;
    throw new ApiError(response.status, error?.code || 'REQUEST_FAILED', error?.message || 'Request failed.');
  }

  return body as T;
}

async function fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
  const network = await NetInfo.fetch();
  if (network.isConnected === false) throw new NetworkError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${API_BASE_URL}/${path.replace(/^\//, '')}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    throw new NetworkError(error instanceof Error && error.name === 'AbortError' ? 'The request timed out.' : undefined);
  } finally {
    clearTimeout(timer);
  }
}

async function publicRequest<T>(path: string, init: RequestInit): Promise<T> {
  return parseResponse<T>(await fetchWithTimeout(path, init));
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const session = await publicRequest<LoginResponse>('auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      deviceId: await getDeviceId(),
      deviceName: Device.deviceName || 'iPhone',
    }),
  });
  await persistSession(session);
  return session;
}

async function performRefresh(): Promise<boolean> {
  const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!storedRefreshToken) return false;

  try {
    const session = await publicRequest<RefreshResponse>('auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });
    await persistSession(session);
    return true;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await clearSession();
      sessionInvalidatedHandler?.();
      return false;
    }
    throw error;
  }
}

export async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function ensureAccessToken(): Promise<boolean> {
  if (accessToken && Date.now() < accessTokenExpiresAt - EXPIRY_BUFFER_MS) return true;
  return refreshSession();
}

async function performAuthorizedRequest<T>(path: string, init: RequestInit, mayRetry: boolean): Promise<T> {
  const ready = await ensureAccessToken();
  if (!ready || !accessToken) throw new ApiError(401, 'SESSION_REQUIRED', 'Please sign in again.');

  const response = await fetchWithTimeout(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401 && mayRetry && (await refreshSession())) {
    return performAuthorizedRequest<T>(path, init, false);
  }

  try {
    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.code === 'PASSWORD_RESET_REQUIRED')) {
      await clearSession();
      sessionInvalidatedHandler?.();
    }
    throw error;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return performAuthorizedRequest<T>(path, init, true);
}

export async function logout(): Promise<void> {
  try {
    const ready = await ensureAccessToken();
    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (ready && accessToken && storedRefreshToken) {
      const response = await fetchWithTimeout('auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await parseResponse<{ success: true }>(response);
    }
  } finally {
    await clearSession();
  }
}
