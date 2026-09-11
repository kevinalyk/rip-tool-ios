import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDeviceId } from '@/lib/api/client';
import { mobileApi } from '@/lib/api/endpoints';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getPushPermissionState(): Promise<PushPermissionState> {
  if (Platform.OS !== 'ios' || !Device.isDevice) return 'unavailable';
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) return 'granted';
  return permissions.status === 'denied' ? 'denied' : 'undetermined';
}

function getProjectId(): string {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Push notification setup is missing the Expo project ID.');
  return projectId;
}

async function registerCurrentDevice(followingEnabled?: boolean): Promise<void> {
  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId: getProjectId() })).data;
  await mobileApi.registerPushToken({
    expoPushToken,
    deviceId: await getDeviceId(),
    platform: 'ios',
    followingEnabled,
  });
}

export async function enablePushNotifications(): Promise<PushPermissionState> {
  if (Platform.OS !== 'ios' || !Device.isDevice) return 'unavailable';

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    permissions = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }
  if (!permissions.granted) return 'denied';

  await registerCurrentDevice();
  return 'granted';
}

export async function enableFollowingPushNotifications(): Promise<PushPermissionState> {
  if (Platform.OS !== 'ios' || !Device.isDevice) return 'unavailable';

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    permissions = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }
  if (!permissions.granted) return 'denied';

  await registerCurrentDevice(true);
  return 'granted';
}

export async function disableFollowingPushNotifications(): Promise<void> {
  await mobileApi.setFollowingPushPreference(await getDeviceId(), false);
}

export async function syncFollowingPushNotificationsIfEnabled(enabled: boolean): Promise<void> {
  if (enabled && (await getPushPermissionState()) === 'granted') {
    await registerCurrentDevice(true);
  }
}

export async function syncPushNotificationsIfGranted(): Promise<void> {
  if (await getPushPermissionState() === 'granted') await registerCurrentDevice();
}

export async function unregisterPushNotifications(): Promise<void> {
  await mobileApi.unregisterPushToken(await getDeviceId());
}

export function addNotificationResponseListener(
  onOpenMessage: (feedItemId: string, messageType: 'email' | 'sms') => void,
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (
      data &&
      typeof data.feedItemId === 'string' &&
      (data.messageType === 'email' || data.messageType === 'sms')
    ) {
      onOpenMessage(data.feedItemId, data.messageType);
    }
  });
}

export async function getLastNotificationTarget(): Promise<{
  feedItemId: string;
  messageType: 'email' | 'sms';
} | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification.request.content.data;
  if (!data || typeof data.feedItemId !== 'string' || (data.messageType !== 'email' && data.messageType !== 'sms')) return null;
  await Notifications.clearLastNotificationResponseAsync();
  return { feedItemId: data.feedItemId, messageType: data.messageType };
}
