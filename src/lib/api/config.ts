export const PRODUCTION_API_URL = 'https://app.rip-tool.com/api/mobile/v1';

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be a valid URL.');
  }

  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && localHost)) {
    throw new Error('The mobile API must use HTTPS (except localhost development).');
  }
  if (parsed.username || parsed.password) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must not contain credentials.');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must not contain a query or fragment.');
  }

  const path = parsed.pathname.replace(/\/+$/, '');
  if (path && path !== '/api/mobile/v1') {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be an origin or end in /api/mobile/v1.');
  }

  parsed.pathname = '/api/mobile/v1';
  return parsed.toString().replace(/\/$/, '');
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || PRODUCTION_API_URL);
