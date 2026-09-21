import assert from 'node:assert/strict';
import test from 'node:test';

import type { MobileClientEntitlements, UserProfile } from '@/lib/api/types';
import { getMobileDataScope } from '@/lib/mobile-data-scope';

function profile(
  overrides: Partial<{
    userId: string;
    clientId: string;
    plan: string;
    entitlements: MobileClientEntitlements;
  }> = {},
): UserProfile {
  return {
    id: overrides.userId ?? 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'client',
    firstLogin: false,
    client: {
      id: overrides.clientId ?? 'client-1',
      name: 'Client',
      slug: 'client',
      subscriptionPlan: overrides.plan ?? 'free',
      subscriptionStatus: 'active',
      hasCompetitiveInsights: true,
      trialExpiresAt: null,
      entitlements: overrides.entitlements ?? {
        canSearchAndFilterFeed: false,
        canUseAlerts: false,
        feedHistoryHours: 1,
        feedDelayHours: 24,
        followedEntityLimit: 0,
      },
    },
  };
}

test('data scope changes when the authenticated organization changes', () => {
  assert.notDeepEqual(
    getMobileDataScope(profile({ clientId: 'client-1' })),
    getMobileDataScope(profile({ clientId: 'client-2' })),
  );
});

test('data scope changes when server entitlements change', () => {
  const starter = getMobileDataScope(profile());
  const paid = getMobileDataScope(profile({
    plan: 'paid',
    entitlements: {
      canSearchAndFilterFeed: true,
      canUseAlerts: true,
      feedHistoryHours: 72,
      feedDelayHours: 0,
      followedEntityLimit: 3,
    },
  }));

  assert.notDeepEqual(starter, paid);
});

test('missing users receive a stable fail-closed scope', () => {
  assert.deepEqual(getMobileDataScope(null), getMobileDataScope(null));
  assert.equal(getMobileDataScope(null).hasCompetitiveInsights, false);
  assert.equal(getMobileDataScope(null).entitlements.canSearchAndFilterFeed, false);
});
