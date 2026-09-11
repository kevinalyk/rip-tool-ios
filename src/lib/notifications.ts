import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { getDeviceId } from '@/lib/api/client';
import { mobileApi } from '@/lib/api/endpoints';
import {
  cacheFollowingPushPreference,
  decodeFollowingPushPreference,
  encodeFollowingPushPreference,
  getCachedFollowingPushPreference,
  type FollowingPushPermission,
  type FollowingPushPreferenceSnapshot,
} from '@/lib/following-push-preference-cache';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushPermissionState = FollowingPushPermission;

const FOLLOWING_PREFERENCE_KEY_PREFIX = 'rip.mobile.following-push-preference';

function followingPreferenceKey(userId: string): string {
  return `${FOLLOWING_PREFERENCE_KEY_PREFIX}.${userId}`;
}

async function rememberFollowingPushPreference(
  userId: string,
  snapshot: FollowingPushPreferenceSnapshot,
): Promise<FollowingPushPreferenceSnapshot> {
  cacheFollowingPushPreference(userId, snapshot);
  await SecureStore.setItemAsync(
    followingPreferenceKey(userId),
    encodeFollowingPushPreference(snapshot),
    { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY },
  );
  return snapshot;
}

export { getCachedFollowingPushPreference };

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

async function registerCurrentDevice(followingEnabled?: boolean) {
  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId: getProjectId() })).data;
  return mobileApi.registerPushToken({
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

export async function enableFollowingPushNotifications(userId: string): Promise<PushPermissionState> {
  if (Platform.OS !== 'ios' || !Device.isDevice) return 'unavailable';

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    permissions = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }
  if (!permissions.granted) return 'denied';

  const response = await registerCurrentDevice(true);
  await rememberFollowingPushPreference(userId, {
    permission: 'granted',
    preference: {
      registered: true,
      enabled: response.data.enabled && response.data.followingEnabled,
      lastSeenAt: response.data.lastSeenAt,
    },
  });
  return 'granted';
}

export async function disableFollowingPushNotifications(userId: string): Promise<void> {
  const [permission, response] = await Promise.all([
    getPushPermissionState(),
    getDeviceId().then((deviceId) => mobileApi.setFollowingPushPreference(deviceId, false)),
  ]);
  await rememberFollowingPushPreference(userId, { permission, preference: response.data });
}

export async function syncFollowingPushNotificationsIfEnabled(
  userId: string,
  enabled: boolean,
): Promise<FollowingPushPreferenceSnapshot | undefined> {
  if (enabled && (await getPushPermissionState()) === 'granted') {
    const response = await registerCurrentDevice(true);
    return rememberFollowingPushPreference(userId, {
      permission: 'granted',
      preference: {
        registered: true,
        enabled: response.data.enabled && response.data.followingEnabled,
        lastSeenAt: response.data.lastSeenAt,
      },
    });
  }
  return undefined;
}

export async function loadFollowingPushPreference(
  userId: string,
): Promise<FollowingPushPreferenceSnapshot> {
  const [permission, response] = await Promise.all([
    getPushPermissionState(),
    getDeviceId().then(mobileApi.followingPushPreference),
  ]);
  const synced = await syncFollowingPushNotificationsIfEnabled(userId, response.data.enabled);
  if (synced) return synced;
  return rememberFollowingPushPreference(userId, { permission, preference: response.data });
}

export async function hydrateFollowingPushPreference(userId: string): Promise<void> {
  try {
    const stored = decodeFollowingPushPreference(
      await SecureStore.getItemAsync(followingPreferenceKey(userId)),
    );
    if (stored) {
      cacheFollowingPushPreference(userId, stored);
      return;
    }

    // Existing installations have no local snapshot yet. Prime it once while the
    // splash/auth bootstrap is still active so the first rendered switch is accurate.
    await loadFollowingPushPreference(userId);
  } catch {
    // Preference hydration must never prevent an otherwise valid sign-in.
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
