import type { DirectoryFilters, FeedFilters } from '@/lib/api/types';

export function buildFeedQuery(filters: FeedFilters, cursor?: string | null): string {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set('search', filters.search.trim());
  filters.entityIds?.forEach((entityId) => params.append('entityId', entityId));
  if (filters.party) params.set('party', filters.party);
  if (filters.state) params.set('state', filters.state);
  if (filters.entityType) params.set('entityType', filters.entityType);

  const messageFilters = filters.messageFilters || [];
  const hasEmail = messageFilters.includes('email');
  const hasSms = messageFilters.includes('sms');
  if (hasEmail !== hasSms) params.set('messageType', hasEmail ? 'email' : 'sms');

  const hasThirdParty = messageFilters.includes('third_party');
  const hasHouseFile = messageFilters.includes('house_file');
  if (hasThirdParty !== hasHouseFile) {
    params.set(hasThirdParty ? 'thirdParty' : 'houseFileOnly', 'true');
  }

  if (filters.donationPlatform) params.set('donationPlatform', filters.donationPlatform);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  if (filters.subscriptionsOnly) params.set('subscriptionsOnly', 'true');
  if (cursor) params.set('cursor', cursor);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function buildDirectoryQuery(filters: DirectoryFilters, cursor?: string | null): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.party) params.set('party', filters.party);
  if (filters.state) params.set('state', filters.state);
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return query ? `?${query}` : '';
}
