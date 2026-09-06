import type { FeedFilters } from '@/lib/api/types';

export function buildFeedQuery(filters: FeedFilters, cursor?: string | null): string {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.party) params.set('party', filters.party);
  if (filters.state) params.set('state', filters.state);
  if (filters.office) params.set('office', filters.office);
  if (filters.messageType) params.set('messageType', filters.messageType);
  if (filters.subscriptionsOnly) params.set('subscriptionsOnly', 'true');
  if (cursor) params.set('cursor', cursor);

  const query = params.toString();
  return query ? `?${query}` : '';
}
