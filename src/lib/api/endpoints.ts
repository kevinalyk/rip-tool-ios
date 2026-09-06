import { apiRequest } from '@/lib/api/client';
import { buildFeedQuery } from '@/lib/api/query';
import type {
  AlertSubscription,
  CreateAlertInput,
  Entity,
  FeedDetail,
  FeedFilterOptions,
  FeedFilters,
  FeedPage,
  MessageType,
  UserProfile,
} from '@/lib/api/types';

export const mobileApi = {
  me: () => apiRequest<UserProfile>('auth/me'),
  feed: (filters: FeedFilters, cursor?: string | null) =>
    apiRequest<FeedPage>(`feed${buildFeedQuery(filters, cursor)}`),
  feedFilters: () => apiRequest<FeedFilterOptions>('feed/filters'),
  feedItem: (id: string, type: MessageType) =>
    apiRequest<{ data: FeedDetail }>(`feed/${encodeURIComponent(id)}?type=${type}`),
  followedEntities: () => apiRequest<{ data: Entity[] }>('entities/followed'),
  followEntity: (id: string) =>
    apiRequest<{ following: true; alreadyFollowing: boolean }>(`entities/${encodeURIComponent(id)}/follow`, {
      method: 'POST',
    }),
  unfollowEntity: (id: string) =>
    apiRequest<{ following: false }>(`entities/${encodeURIComponent(id)}/follow`, { method: 'DELETE' }),
  alerts: () => apiRequest<{ data: AlertSubscription[] }>('alerts'),
  createAlert: (input: CreateAlertInput) =>
    apiRequest<{ data: AlertSubscription }>('alerts', { method: 'POST', body: JSON.stringify(input) }),
  deleteAlert: (id: string) =>
    apiRequest<{ ok: true }>(`alerts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
