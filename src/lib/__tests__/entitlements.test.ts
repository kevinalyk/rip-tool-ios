import assert from 'node:assert/strict';
import test from 'node:test';

import type { MobileClientEntitlements, UserProfile } from '../api/types';
import {
  canFollowNewEntities,
  getMobileEntitlements,
  sanitizeFeedFiltersForEntitlements,
} from '../entitlements';

const FREE_META = {
  isAdFree: false,
  accessSource: 'free' as const,
  clientPlanCoversMobile: false,
  shouldPromptAppleCancellation: false,
};

const PAID_META = {
  isAdFree: true,
  accessSource: 'client_plan' as const,
  clientPlanCoversMobile: true,
  shouldPromptAppleCancellation: false,
};

function profile(entitlements?: Partial<MobileClientEntitlements>): UserProfile {
  return {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'client',
    firstLogin: false,
    client: {
      id: 'client-1',
      name: 'Test Client',
      slug: 'test-client',
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
      hasCompetitiveInsights: true,
      trialExpiresAt: null,
      entitlements,
    },
  };
}

test('missing mobile entitlements fail closed to Starter access', () => {
  assert.deepEqual(getMobileEntitlements(null), {
    canSearchAndFilterFeed: false,
    canUseAlerts: false,
    feedHistoryHours: 1,
    feedDelayHours: 24,
    followedEntityLimit: 0,
    ...FREE_META,
  });
  assert.deepEqual(getMobileEntitlements(profile()), {
    canSearchAndFilterFeed: false,
    canUseAlerts: false,
    feedHistoryHours: 1,
    feedDelayHours: 24,
    followedEntityLimit: 0,
    ...FREE_META,
  });
  assert.deepEqual(
    getMobileEntitlements(
      profile({
        canSearchAndFilterFeed: false,
        canUseAlerts: false,
        feedHistoryHours: 1,
        followedEntityLimit: 0,
      }),
    ),
    {
      canSearchAndFilterFeed: false,
      canUseAlerts: false,
      feedHistoryHours: 1,
      feedDelayHours: 24,
      followedEntityLimit: 0,
      ...FREE_META,
    },
  );
});

test('valid server capabilities are used without deriving them from the plan name', () => {
  const user = profile({
    canSearchAndFilterFeed: true,
    canUseAlerts: true,
    feedHistoryHours: 72,
    feedDelayHours: 0,
    followedEntityLimit: 3,
    ...PAID_META,
  });
  user.client!.subscriptionPlan = 'unexpected-display-name';

  assert.deepEqual(getMobileEntitlements(user), {
    canSearchAndFilterFeed: true,
    canUseAlerts: true,
    feedHistoryHours: 72,
    feedDelayHours: 0,
    followedEntityLimit: 3,
    ...PAID_META,
  });
});

test('malformed server capability values fail closed', () => {
  assert.deepEqual(
    getMobileEntitlements(
      profile({
        canSearchAndFilterFeed: false,
        canUseAlerts: false,
        feedHistoryHours: Number.NaN,
        feedDelayHours: Number.NaN,
        followedEntityLimit: -1,
      }),
    ),
    {
      canSearchAndFilterFeed: false,
      canUseAlerts: false,
      feedHistoryHours: 1,
      feedDelayHours: 24,
      followedEntityLimit: 0,
      ...FREE_META,
    },
  );
});

test('locked accounts cannot serialize stale feed filters', () => {
  const filters = { search: 'fundraising', state: 'TX', subscriptionsOnly: true };
  const starter = getMobileEntitlements(profile());
  const paid = getMobileEntitlements(
    profile({ canSearchAndFilterFeed: true, canUseAlerts: true, feedHistoryHours: 72, feedDelayHours: 0, followedEntityLimit: 3, ...PAID_META }),
  );

  assert.deepEqual(sanitizeFeedFiltersForEntitlements(filters, starter), {});
  assert.equal(sanitizeFeedFiltersForEntitlements(filters, paid), filters);
});

test('follow capability handles zero, limited, and unlimited plans', () => {
  assert.equal(canFollowNewEntities({ canSearchAndFilterFeed: false, canUseAlerts: false, feedHistoryHours: 1, feedDelayHours: 24, followedEntityLimit: 0, ...FREE_META }), false);
  assert.equal(canFollowNewEntities({ canSearchAndFilterFeed: true, canUseAlerts: true, feedHistoryHours: 72, feedDelayHours: 0, followedEntityLimit: 3, ...PAID_META }), true);
  assert.equal(canFollowNewEntities({ canSearchAndFilterFeed: true, canUseAlerts: true, feedHistoryHours: null, feedDelayHours: 0, followedEntityLimit: null, ...PAID_META }), true);
});
