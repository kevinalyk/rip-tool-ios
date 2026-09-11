import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cacheFollowingPushPreference,
  decodeFollowingPushPreference,
  encodeFollowingPushPreference,
  getCachedFollowingPushPreference,
  type FollowingPushPreferenceSnapshot,
} from '@/lib/following-push-preference-cache';

const enabledSnapshot: FollowingPushPreferenceSnapshot = {
  permission: 'granted',
  preference: { registered: true, enabled: true, lastSeenAt: '2026-09-11T14:00:00.000Z' },
};

test('cached following preference is available synchronously for the first render', () => {
  cacheFollowingPushPreference('push-cache-user', enabledSnapshot);
  assert.deepEqual(getCachedFollowingPushPreference('push-cache-user'), enabledSnapshot);
  assert.equal(getCachedFollowingPushPreference('different-user'), undefined);
});

test('following preference snapshots round-trip through persistent storage', () => {
  assert.deepEqual(decodeFollowingPushPreference(encodeFollowingPushPreference(enabledSnapshot)), enabledSnapshot);
});

test('malformed following preference snapshots fail closed', () => {
  assert.equal(decodeFollowingPushPreference(null), undefined);
  assert.equal(decodeFollowingPushPreference('not-json'), undefined);
  assert.equal(decodeFollowingPushPreference('{"permission":"granted","preference":{"enabled":true}}'), undefined);
  assert.equal(decodeFollowingPushPreference('{"permission":"unexpected","preference":{"registered":true,"enabled":true,"lastSeenAt":null}}'), undefined);
});
