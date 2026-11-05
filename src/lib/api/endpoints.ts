import { ApiError, apiRequest } from '@/lib/api/client';
import { buildDirectoryQuery, buildFeedQuery } from '@/lib/api/query';
import {
  excludeCorporateEntities,
  excludeCorporateFeedItems,
  isCorporateEntity,
} from '@/lib/rip-entity-scope';
import type {
  AlertFilterOptions,
  AlertSubscription,
  AnnouncementDetail,
  AnnouncementPage,
  CreateAlertInput,
  CreateSavedFeedViewInput,
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
  FollowingPushPreference,
  MessageType,
  SavedFeedView,
  UserProfile,
} from '@/lib/api/types';

export const mobileApi = {
  me: () => apiRequest<UserProfile>('auth/me'),
  feed: async (filters: FeedFilters, cursor?: string | null) => {
    const page = await apiRequest<FeedPage>(`feed${buildFeedQuery(filters, cursor)}`);
    return { ...page, data: excludeCorporateFeedItems(page.data) };
  },
  feedFilters: async () => {
    const options = await apiRequest<FeedFilterOptions>('feed/filters');
    return {
      ...options,
      entities: options.entities ? excludeCorporateEntities(options.entities) : undefined,
    };
  },
  savedFeedViews: () => apiRequest<{ data: SavedFeedView[] }>('feed/views'),
  createSavedFeedView: (input: CreateSavedFeedViewInput) =>
    apiRequest<{ data: SavedFeedView }>('feed/views', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  feedItem: async (id: string, type: MessageType) => {
    const result = await apiRequest<{ data: FeedDetail }>(`feed/${encodeURIComponent(id)}?type=${type}`);
    if (isCorporateEntity(result.data.entity)) {
      throw new ApiError(404, 'FEED_ITEM_NOT_FOUND', 'This message is not available in RIP.');
    }
    return result;
  },
  shareFeedItem: (id: string, type: MessageType) =>
    apiRequest<FeedShare>(`feed/${encodeURIComponent(id)}/share?type=${type}`, { method: 'POST' }),
  followedEntities: async () => {
    const result = await apiRequest<{ data: Entity[] }>('entities/followed');
    return { ...result, data: excludeCorporateEntities(result.data) };
  },
  followEntity: (id: string) =>
    apiRequest<{ following: true; alreadyFollowing: boolean }>(`entities/${encodeURIComponent(id)}/follow`, {
      method: 'POST',
    }),
  unfollowEntity: (id: string) =>
    apiRequest<{ following: false }>(`entities/${encodeURIComponent(id)}/follow`, { method: 'DELETE' }),
  directory: async (filters: DirectoryFilters, cursor?: string | null) => {
    const page = await apiRequest<DirectoryPage>(`entities${buildDirectoryQuery(filters, cursor)}`);
    return { ...page, data: excludeCorporateEntities(page.data) };
  },
  directoryOptions: () => apiRequest<DirectoryOptions>('entities/options'),
  directoryEntity: async (id: string) => {
    const result = await apiRequest<{ data: DirectoryEntityDetail }>(`entities/${encodeURIComponent(id)}`);
    if (isCorporateEntity(result.data)) {
      throw new ApiError(404, 'ENTITY_NOT_FOUND', 'This entity is not available in RIP.');
    }
    return result;
  },
  alerts: () => apiRequest<{ data: AlertSubscription[] }>('alerts'),
  alertOptions: async () => {
    const options = await apiRequest<AlertFilterOptions>('alerts/options');
    return {
      ...options,
      entities: excludeCorporateEntities(options.entities),
    };
  },
  createAlert: (input: CreateAlertInput) =>
    apiRequest<{ data: AlertSubscription }>('alerts', { method: 'POST', body: JSON.stringify(input) }),
  deleteAlert: (id: string) =>
    apiRequest<{ ok: true }>(`alerts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  followingPushPreference: (deviceId: string) =>
    apiRequest<{ data: FollowingPushPreference }>(`push-token?deviceId=${encodeURIComponent(deviceId)}`),
  registerPushToken: (input: {
    expoPushToken: string;
    deviceId: string;
    platform: 'ios';
    followingEnabled?: boolean;
  }) =>
    apiRequest<{ data: { id: string; enabled: boolean; followingEnabled: boolean; lastSeenAt: string } }>('push-token', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  setFollowingPushPreference: (deviceId: string, followingEnabled: boolean) =>
    apiRequest<{ data: FollowingPushPreference }>('push-token', {
      method: 'PATCH',
      body: JSON.stringify({ deviceId, followingEnabled }),
    }),
  unregisterPushToken: (deviceId: string) =>
    apiRequest<{ ok: true }>('push-token', { method: 'DELETE', body: JSON.stringify({ deviceId }) }),
  announcements: (cursor?: string | null) =>
    apiRequest<AnnouncementPage>(`news${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  announcement: (slug: string) =>
    apiRequest<{ data: AnnouncementDetail }>(`news/${encodeURIComponent(slug)}`),
};
