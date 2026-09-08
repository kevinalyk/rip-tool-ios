import type { FeedFilters, MobileClientEntitlements, UserProfile } from '@/lib/api/types';

const FAIL_CLOSED_ENTITLEMENTS: MobileClientEntitlements = {
  canSearchAndFilterFeed: false,
  feedHistoryHours: 3,
  followedEntityLimit: 0,
};

/**
 * Entitlements come from the authenticated server profile. Missing or malformed
 * values use Starter-level access; the native app never guesses capabilities from
 * a plan name or maintains a duplicate pricing matrix.
 */
export function getMobileEntitlements(user: UserProfile | null): MobileClientEntitlements {
  const entitlements = user?.client?.entitlements;
  if (!entitlements) return FAIL_CLOSED_ENTITLEMENTS;

  const historyHours = entitlements.feedHistoryHours;
  const followedEntityLimit = entitlements.followedEntityLimit;

  return {
    canSearchAndFilterFeed: entitlements.canSearchAndFilterFeed === true,
    feedHistoryHours:
      historyHours === null ||
      (typeof historyHours === 'number' && Number.isFinite(historyHours) && historyHours >= 0)
        ? historyHours
        : FAIL_CLOSED_ENTITLEMENTS.feedHistoryHours,
    followedEntityLimit:
      followedEntityLimit === null ||
      (typeof followedEntityLimit === 'number' &&
        Number.isInteger(followedEntityLimit) &&
        followedEntityLimit >= 0)
        ? followedEntityLimit
        : FAIL_CLOSED_ENTITLEMENTS.followedEntityLimit,
  };
}

export function sanitizeFeedFiltersForEntitlements(
  filters: FeedFilters,
  entitlements: MobileClientEntitlements,
): FeedFilters {
  return entitlements.canSearchAndFilterFeed ? filters : {};
}

export function canFollowNewEntities(entitlements: MobileClientEntitlements): boolean {
  return entitlements.followedEntityLimit === null || entitlements.followedEntityLimit > 0;
}
