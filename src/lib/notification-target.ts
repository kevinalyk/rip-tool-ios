export type NotificationTarget =
  | { kind: 'feed'; feedItemId: string; messageType: 'email' | 'sms' }
  | { kind: 'announcement'; slug: string };

export function decodeNotificationTarget(data: unknown): NotificationTarget | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  if (
    typeof record.feedItemId === 'string' &&
    (record.messageType === 'email' || record.messageType === 'sms')
  ) {
    return {
      kind: 'feed',
      feedItemId: record.feedItemId,
      messageType: record.messageType,
    };
  }

  if (typeof record.announcementSlug === 'string' && record.announcementSlug.trim()) {
    return { kind: 'announcement', slug: record.announcementSlug.trim() };
  }

  return null;
}
