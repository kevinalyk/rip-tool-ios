import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { themes } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { AppQueryProvider } from '@/providers/query-provider';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { state, error, retry } = useAuth();
  const scheme = useColorScheme();
  const theme = themes[scheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    if (state !== 'loading') void SplashScreen.hideAsync();
  }, [state]);

  if (state === 'loading') return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  if (state === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ContentState
          mode="error"
          title="Couldn’t restore your session"
          message={error || undefined}
          actionLabel="Try again"
          onAction={() => void retry()}
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Protected guard={state === 'unauthenticated'}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={state === 'authenticated'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="feed/[id]" options={{ title: 'Message' }} />
        <Stack.Screen name="alerts/new" options={{ title: 'New alert', presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = themes[scheme === 'dark' ? 'dark' : 'light'];
  const navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          primary: colors.red,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <AppQueryProvider>
        <AuthProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </AuthProvider>
      </AppQueryProvider>
    </ThemeProvider>
  );
}
