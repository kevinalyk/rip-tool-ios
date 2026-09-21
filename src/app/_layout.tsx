import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { FaceIdGate } from '@/components/face-id-gate';
import { LaunchAnimation, LaunchHoldingScreen } from '@/components/launch-animation';
import { themes } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { AppearanceProvider, useAppearancePreference } from '@/providers/appearance-provider';
import { AppQueryProvider } from '@/providers/query-provider';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationTarget,
} from '@/lib/notifications';
import { notificationQueryKeys, type NotificationTarget } from '@/lib/notification-target';

void SplashScreen.preventAutoHideAsync();

let hasPlayedLaunchAnimation = false;

function RootNavigator() {
  const { state, error, retry, unlockWithFaceId, continueWithPassword } = useAuth();
  const queryClient = useQueryClient();
  const scheme = useColorScheme();
  const theme = themes[scheme === 'dark' ? 'dark' : 'light'];

  const refreshNotificationTarget = useCallback((target: NotificationTarget) => {
    void Promise.all(
      notificationQueryKeys(target).map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  }, [queryClient]);

  const openNotificationTarget = useCallback((target: NotificationTarget) => {
    refreshNotificationTarget(target);
    if (target.kind === 'announcement') {
      router.push({ pathname: '/news/[slug]', params: { slug: target.slug } });
      return;
    }
    router.push({
      pathname: '/feed/[id]',
      params: { id: target.feedItemId, type: target.messageType },
    });
  }, [refreshNotificationTarget]);

  useEffect(() => {
    const subscription = addNotificationReceivedListener(refreshNotificationTarget);
    return () => subscription.remove();
  }, [refreshNotificationTarget]);

  useEffect(() => {
    const subscription = addNotificationResponseListener(openNotificationTarget);
    return () => subscription.remove();
  }, [openNotificationTarget]);

  useEffect(() => {
    if (state !== 'authenticated') return;
    void getLastNotificationTarget().then((target) => {
      if (target) openNotificationTarget(target);
    });
  }, [openNotificationTarget, state]);

  if (state === 'loading') return null;

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
        <Stack.Screen name="signup" options={{ title: 'Create account', presentation: 'modal' }} />
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

function LaunchSequencedApp() {
  const { ready: appearanceReady } = useAppearancePreference();
  const [launchComplete, setLaunchComplete] = useState(hasPlayedLaunchAnimation);
  const [animateLaunch] = useState(!hasPlayedLaunchAnimation);

  const finishLaunchAnimation = useCallback(() => {
    hasPlayedLaunchAnimation = true;
    setLaunchComplete(true);
  }, []);

  useEffect(() => {
    if (!appearanceReady) return;
    void SplashScreen.hideAsync();
  }, [appearanceReady]);

  if (!appearanceReady) return null;

  return (
    <ThemedRootLayout
      animateLaunch={animateLaunch}
      launchComplete={launchComplete}
      onLaunchComplete={finishLaunchAnimation}
    />
  );
}

type ThemedRootLayoutProps = {
  animateLaunch: boolean;
  launchComplete: boolean;
  onLaunchComplete: () => void;
};

function SequencedRoot({ animateLaunch, launchComplete, onLaunchComplete }: ThemedRootLayoutProps) {
  const { state } = useAuth();
  const scheme = useColorScheme();
  const colors = themes[scheme === 'dark' ? 'dark' : 'light'];
  const showLaunchSurface = !launchComplete || state === 'loading';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      {showLaunchSurface
        ? animateLaunch
          ? <LaunchAnimation onFinish={onLaunchComplete} />
          : <LaunchHoldingScreen />
        : null}
    </View>
  );
}

function ThemedRootLayout({ animateLaunch, launchComplete, onLaunchComplete }: ThemedRootLayoutProps) {
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
        <AuthProvider bootstrapEnabled={launchComplete}>
          <SequencedRoot
            animateLaunch={animateLaunch}
            launchComplete={launchComplete}
            onLaunchComplete={onLaunchComplete}
          />
        </AuthProvider>
      </AppQueryProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <LaunchSequencedApp />
    </AppearanceProvider>
  );
}
