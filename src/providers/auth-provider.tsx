import { useQueryClient } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type AuthContextValue = {
  state: AuthState;
  user: UserProfile | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  const bootstrap = useCallback(async () => {
    try {
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
    let cancelled = false;

    async function restore() {
      try {
        const profile = await restoreStoredProfile();
        if (cancelled) return;
        if (!profile) {
          becomeSignedOut();
          return;
        }
        setUser(profile);
        setState('authenticated');
      } catch (bootstrapError) {
        if (cancelled) return;
        setError(bootstrapError instanceof Error ? bootstrapError.message : 'Unable to restore your session.');
        setState('error');
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, [becomeSignedOut]);

  const retry = useCallback(async () => {
    setState('loading');
    setError(null);
    await bootstrap();
  }, [bootstrap]);

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
      await logout();
    } finally {
      becomeSignedOut();
    }
  }, [becomeSignedOut]);

  const refreshProfile = useCallback(async () => {
    const profile = await mobileApi.me();
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, user, error, signIn, signOut, retry, refreshProfile }),
    [error, refreshProfile, retry, signIn, signOut, state, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}
