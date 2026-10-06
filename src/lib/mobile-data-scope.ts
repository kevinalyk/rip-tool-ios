import type { UserProfile } from '@/lib/api/types';
import { getMobileEntitlements } from '@/lib/entitlements';

/**
 * Identifies the authenticated data-access context behind a cached response.
 *
 * Keeping this context in tenant- and entitlement-sensitive query keys ensures
 * a plan change, organization reassignment, or permission change cannot keep
 * displaying data fetched under the previous access rules.
 */
export function getMobileDataScope(user: UserProfile | null) {
  const entitlements = getMobileEntitlements(user);

  return {
    userId: user?.id ?? null,
    clientId: user?.client?.id ?? null,
    subscriptionPlan: user?.client?.subscriptionPlan ?? null,
    subscriptionStatus: user?.client?.subscriptionStatus ?? null,
    hasCompetitiveInsights: user?.client?.hasCompetitiveInsights ?? false,
    trialExpiresAt: user?.client?.trialExpiresAt ?? null,
    entitlements,
  } as const;
}
