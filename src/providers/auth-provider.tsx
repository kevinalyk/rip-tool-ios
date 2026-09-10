import { useQueryClient } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  clearSession,
  hasStoredSession,
  login,
  logout,
  refreshSession,
  setSessionInvalidatedHandler,
} from '@/lib/api/client';
import { mobileApi } from '@/lib/api/endpoints';
import type { UserProfile } from '@/lib/api/types';
import {
  authenticateWithFaceId,
  faceIdErrorMessage,
  getFaceIdAvailability,
  isFaceIdEnabled,
  setFaceIdEnabled,
} from '@/lib/face-id';
import { unregisterPushNotifications } from '@/lib/notifications';

type AuthState = 'loading' | 'locked' | 'authenticated' | 'unauthenticated' | 'error';
const FACE_ID_RELOCK_MS = 30_000;

type AuthContextValue = {
  state: AuthState;
  user: UserProfile | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  unlockWithFaceId: () => Promise<void>;
  continueWithPassword: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function restoreStoredProfile(): Promise<UserProfile | null> {
  if (!(await hasStoredSession())) return null;
  if (!(await refreshSession())) return null;
  return mobileApi.me();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastAppState = useRef(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);

  const becomeSignedOut = useCallback(() => {
    setUser(null);
    setError(null);
    setState('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setSessionInvalidatedHandler(becomeSignedOut);
    return () => setSessionInvalidatedHandler(null);
  }, [becomeSignedOut]);

  const bootstrap = useCallback(async (requireFaceId = false) => {
    try {
      if (!(await hasStoredSession())) {
        becomeSignedOut();
        return;
      }

      if (requireFaceId && (await isFaceIdEnabled())) {
        const availability = await getFaceIdAvailability();
        if (availability !== 'available') {
          setError(
            availability === 'not-enrolled'
              ? 'Face ID is not set up on this iPhone.'
              : 'Face ID is not available on this iPhone.',
          );
          setState('locked');
          return;
        }

        const result = await authenticateWithFaceId();
        if (!result.success) {
          setError(faceIdErrorMessage(result));
          setState('locked');
          return;
        }
      }

      const profile = await restoreStoredProfile();
      if (!profile) {
        becomeSignedOut();
        return;
      }

      setUser(profile);
      setState('authenticated');
    } catch (bootstrapError) {
      setError(bootstrapError instanceof Error ? bootstrapError.message : 'Unable to restore your session.');
      setState('error');
    }
  }, [becomeSignedOut]);

  useEffect(() => {
    async function restore() {
      await bootstrap(true);
    }

    void restore();
  }, [bootstrap]);

  const retry = useCallback(async () => {
    setState('loading');
    setError(null);
    await bootstrap(false);
  }, [bootstrap]);

  const unlockWithFaceId = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const availability = await getFaceIdAvailability();
      if (availability !== 'available') {
        setError(
          availability === 'not-enrolled'
            ? 'Face ID is not set up on this iPhone.'
            : 'Face ID is not available on this iPhone.',
        );
        setState('locked');
        return;
      }

      const result = await authenticateWithFaceId();
      if (!result.success) {
        setError(faceIdErrorMessage(result));
        setState('locked');
        return;
      }

      await bootstrap(false);
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Unable to use Face ID.');
      setState('locked');
    }
  }, [bootstrap]);

  const continueWithPassword = useCallback(async () => {
    await Promise.all([clearSession(), setFaceIdEnabled(false)]);
    becomeSignedOut();
  }, [becomeSignedOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    await login(email, password);
    try {
      const profile = await mobileApi.me();
      setUser(profile);
      setState('authenticated');
      setError(null);
    } catch (profileError) {
      await clearSession();
      throw profileError;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await unregisterPushNotifications().catch(() => undefined);
      await logout();
    } finally {
      becomeSignedOut();
    }
  }, [becomeSignedOut]);

  const refreshProfile = useCallback(async () => {
    const profile = await mobileApi.me();
    setUser(profile);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const returningToForeground =
        /inactive|background/.test(lastAppState.current) && nextState === 'active';
      if (nextState === 'inactive' || nextState === 'background') {
        backgroundedAt.current ??= Date.now();
      }

      const timeAway = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
      if (nextState === 'active') backgroundedAt.current = null;
      lastAppState.current = nextState;

      if (returningToForeground && state === 'authenticated') {
        void (async () => {
          if (timeAway >= FACE_ID_RELOCK_MS && (await isFaceIdEnabled())) {
            await unlockWithFaceId();
            return;
          }

          // Plan changes made on the web should update the native controls promptly.
          // A transient network failure is non-fatal; the API remains authoritative.
          await refreshProfile().catch(() => undefined);
        })();
      }
    });

    return () => subscription.remove();
  }, [refreshProfile, state, unlockWithFaceId]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, user, error, signIn, signOut, retry, refreshProfile, unlockWithFaceId, continueWithPassword }),
    [continueWithPassword, error, refreshProfile, retry, signIn, signOut, state, unlockWithFaceId, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}
