import assert from 'node:assert/strict';
import test from 'node:test';

import type { FeedFilterEntity } from '@/lib/api/types';
import { sortFeedFilterEntities } from '@/lib/feed-filter-options';
import { followingQueryKeys } from '@/lib/following-query-cache';

function entity(id: string, name: string, isFollowing: boolean): FeedFilterEntity {
  return {
    id,
    name,
    isFollowing,
    party: null,
    state: null,
    type: 'organization',
  };
}

test('feed filter entities put followed entities first and alphabetize each group', () => {
  const original = [
    entity('3', 'Zulu', false),
    entity('2', 'Beta', true),
    entity('1', 'Alpha', true),
    entity('4', 'Delta', false),
  ];

  const sorted = sortFeedFilterEntities(original);

  assert.deepEqual(sorted.map((item) => item.name), ['Alpha', 'Beta', 'Delta', 'Zulu']);
  assert.deepEqual(original.map((item) => item.name), ['Zulu', 'Beta', 'Alpha', 'Delta']);
});

test('following changes invalidate feed filter metadata and entity detail caches', () => {
  assert.deepEqual(followingQueryKeys('entity-1'), [
    ['followed-entities'],
    ['feed-filters'],
    ['directory'],
    ['feed'],
    ['directory-entity', 'entity-1'],
  ]);
});

test('following invalidation omits an entity detail key when no entity is known', () => {
  assert.deepEqual(followingQueryKeys(), [
    ['followed-entities'],
    ['feed-filters'],
    ['directory'],
    ['feed'],
  ]);
});
