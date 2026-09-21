import type { FeedFilterEntity } from '@/lib/api/types';

export function sortFeedFilterEntities(
  entities: readonly FeedFilterEntity[],
): FeedFilterEntity[] {
  return [...entities].sort((left, right) =>
    Number(right.isFollowing) - Number(left.isFollowing) ||
    left.name.localeCompare(right.name),
  );
}
