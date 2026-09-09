import { apiRequest } from '@/lib/api/client';
import { buildDirectoryQuery, buildFeedQuery } from '@/lib/api/query';
import type {
  AlertFilterOptions,
  AlertSubscription,
  CreateAlertInput,
  DirectoryEntityDetail,
  DirectoryFilters,
  DirectoryOptions,
  DirectoryPage,
  Entity,
  FeedDetail,
  FeedFilterOptions,
  FeedFilters,
  FeedPage,
  FeedShare,
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
  shareFeedItem: (id: string, type: MessageType) =>
    apiRequest<FeedShare>(`feed/${encodeURIComponent(id)}/share?type=${type}`, { method: 'POST' }),
  followedEntities: () => apiRequest<{ data: Entity[] }>('entities/followed'),
  followEntity: (id: string) =>
    apiRequest<{ following: true; alreadyFollowing: boolean }>(`entities/${encodeURIComponent(id)}/follow`, {
      method: 'POST',
    }),
  unfollowEntity: (id: string) =>
    apiRequest<{ following: false }>(`entities/${encodeURIComponent(id)}/follow`, { method: 'DELETE' }),
  directory: (filters: DirectoryFilters, cursor?: string | null) =>
    apiRequest<DirectoryPage>(`entities${buildDirectoryQuery(filters, cursor)}`),
  directoryOptions: () => apiRequest<DirectoryOptions>('entities/options'),
  directoryEntity: (id: string) =>
    apiRequest<{ data: DirectoryEntityDetail }>(`entities/${encodeURIComponent(id)}`),
  alerts: () => apiRequest<{ data: AlertSubscription[] }>('alerts'),
  alertOptions: () => apiRequest<AlertFilterOptions>('alerts/options'),
  createAlert: (input: CreateAlertInput) =>
    apiRequest<{ data: AlertSubscription }>('alerts', { method: 'POST', body: JSON.stringify(input) }),
  deleteAlert: (id: string) =>
    apiRequest<{ ok: true }>(`alerts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  registerPushToken: (input: { expoPushToken: string; deviceId: string; platform: 'ios' }) =>
    apiRequest<{ data: { id: string; enabled: boolean; lastSeenAt: string } }>('push-token', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  unregisterPushToken: (deviceId: string) =>
    apiRequest<{ ok: true }>('push-token', { method: 'DELETE', body: JSON.stringify({ deviceId }) }),
};
