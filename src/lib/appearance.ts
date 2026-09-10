export type AppearancePreference = 'system' | 'light' | 'dark';

export function normalizeAppearancePreference(value: string | null | undefined): AppearancePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
