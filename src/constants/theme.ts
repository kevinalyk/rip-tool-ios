import { useColorScheme } from 'react-native';

const brand = {
  red: '#F13346',
  redPressed: '#D62437',
  navy: '#17394A',
  blue: '#3E6C88',
} as const;

export const themes = {
  light: {
    ...brand,
    democrat: '#1559B7',
    background: '#F4F6F8',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceMuted: '#E9EEF2',
    text: '#10232E',
    textMuted: '#647580',
    border: '#DCE4E9',
    success: '#1C7C54',
    warning: '#A96314',
    danger: '#C52C3C',
    overlay: 'rgba(8, 25, 35, 0.48)',
    tabBar: '#FBFCFD',
  },
  dark: {
    ...brand,
    democrat: '#60A5FA',
    background: '#09151D',
    surface: '#10232E',
    surfaceRaised: '#17303D',
    surfaceMuted: '#1C3542',
    text: '#F6F8FA',
    textMuted: '#A5B4BC',
    border: '#294451',
    success: '#51C28B',
    warning: '#E1A454',
    danger: '#FF7180',
    overlay: 'rgba(0, 0, 0, 0.68)',
    tabBar: '#0D1D26',
  },
} as const;

export type AppTheme = (typeof themes)[keyof typeof themes];

export function useAppTheme(): AppTheme {
  return themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#07131A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
} as const;
