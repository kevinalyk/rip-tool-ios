import type { FollowingPushPreference } from '@/lib/api/types';

export type FollowingPushPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type FollowingPushPreferenceSnapshot = {
  permission: FollowingPushPermission;
  preference: FollowingPushPreference;
};

const snapshots = new Map<string, FollowingPushPreferenceSnapshot>();

export function getCachedFollowingPushPreference(
  userId: string,
): FollowingPushPreferenceSnapshot | undefined {
  return snapshots.get(userId);
}

export function cacheFollowingPushPreference(
  userId: string,
  snapshot: FollowingPushPreferenceSnapshot,
): FollowingPushPreferenceSnapshot {
  snapshots.set(userId, snapshot);
  return snapshot;
}

export function encodeFollowingPushPreference(snapshot: FollowingPushPreferenceSnapshot): string {
  return JSON.stringify(snapshot);
}

export function decodeFollowingPushPreference(
  value: string | null,
): FollowingPushPreferenceSnapshot | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as Partial<FollowingPushPreferenceSnapshot>;
    const permission = parsed.permission;
    const preference = parsed.preference;
    if (
      permission !== 'granted' &&
      permission !== 'denied' &&
      permission !== 'undetermined' &&
      permission !== 'unavailable'
    ) return undefined;
    if (
      !preference ||
      typeof preference.registered !== 'boolean' ||
      typeof preference.enabled !== 'boolean' ||
      (preference.lastSeenAt !== null && typeof preference.lastSeenAt !== 'string')
    ) return undefined;

    return { permission, preference };
  } catch {
    return undefined;
  }
}
