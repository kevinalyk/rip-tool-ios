import type { QueryClient } from '@tanstack/react-query';

export function followingQueryKeys(entityId?: string | null): readonly (readonly unknown[])[] {
  return [
    ['followed-entities'],
    ['feed-filters'],
    ['directory'],
    ['feed'],
    ...(entityId ? [['directory-entity', entityId] as const] : []),
  ];
}

export async function invalidateFollowingQueries(
  queryClient: QueryClient,
  entityId?: string | null,
): Promise<void> {
  await Promise.all(
    followingQueryKeys(entityId).map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
