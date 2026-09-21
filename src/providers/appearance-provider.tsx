import * as SecureStore from 'expo-secure-store';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { normalizeAppearancePreference, type AppearancePreference } from '@/lib/appearance';

const APPEARANCE_PREFERENCE_KEY = 'inboxgop.appearance-preference';

type AppearanceContextValue = {
  ready: boolean;
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function applyPreference(preference: AppearancePreference) {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      let normalized: AppearancePreference = 'system';
      try {
        normalized = normalizeAppearancePreference(
          await SecureStore.getItemAsync(APPEARANCE_PREFERENCE_KEY),
        );
      } catch {
        normalized = 'system';
      } finally {
        if (!active) return;
        applyPreference(normalized);
        setPreferenceState(normalized);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback(async (nextPreference: AppearancePreference) => {
    applyPreference(nextPreference);
    setPreferenceState(nextPreference);
    await SecureStore.setItemAsync(APPEARANCE_PREFERENCE_KEY, nextPreference, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }, []);

  const value = useMemo(
    () => ({ ready, preference, setPreference }),
    [preference, ready, setPreference],
  );
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearancePreference(): AppearanceContextValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearancePreference must be used within AppearanceProvider.');
  return value;
}
