import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { FaceIdGate } from '@/components/face-id-gate';
import { themes } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { AppQueryProvider } from '@/providers/query-provider';
import { addNotificationResponseListener, getLastNotificationTarget } from '@/lib/notifications';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { state, error, retry, unlockWithFaceId, continueWithPassword } = useAuth();
  const scheme = useColorScheme();
  const theme = themes[scheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    if (state !== 'loading') void SplashScreen.hideAsync();
  }, [state]);

  useEffect(() => {
    const subscription = addNotificationResponseListener((feedItemId, messageType) => {
      router.push({ pathname: '/feed/[id]', params: { id: feedItemId, type: messageType } });
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (state !== 'authenticated') return;
    void getLastNotificationTarget().then((target) => {
      if (target) router.push({ pathname: '/feed/[id]', params: { id: target.feedItemId, type: target.messageType } });
    });
  }, [state]);

  if (state === 'loading') return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  if (state === 'locked') {
    return (
      <FaceIdGate
        error={error}
        onUnlock={() => void unlockWithFaceId()}
        onUsePassword={() => void continueWithPassword()}
      />
    );
  }

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
        <Stack.Screen name="directory/[id]" options={{ title: 'Entity profile' }} />
        <Stack.Screen name="news/index" options={{ title: "What's New" }} />
        <Stack.Screen name="news/[slug]" options={{ title: 'Update' }} />
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
