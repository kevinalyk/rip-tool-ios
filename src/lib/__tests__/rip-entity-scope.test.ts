import assert from 'node:assert/strict';
import test from 'node:test';

import {
  excludeCorporateEntities,
  excludeCorporateEntityTypes,
  excludeCorporateFeedItems,
  isCorporateEntity,
} from '@/lib/rip-entity-scope';

test('corporate flag and Media/Retail types are excluded even with mixed casing', () => {
  assert.equal(isCorporateEntity({ type: 'organization', isCorporate: true }), true);
  assert.equal(isCorporateEntity({ type: ' Media ' }), true);
  assert.equal(isCorporateEntity({ type: 'RETAIL' }), true);
  assert.equal(isCorporateEntity({ type: 'state_party', isCorporate: false }), false);
  assert.equal(isCorporateEntity(null), false);
});

test('entity lists and filter choices omit corporate entities', () => {
  const entities = [
    { id: 'political', type: 'candidate' },
    { id: 'media', type: 'media' },
    { id: 'flagged', type: 'organization', isCorporate: true },
  ];
  assert.deepEqual(excludeCorporateEntities(entities).map((entity) => entity.id), ['political']);
  assert.deepEqual(
    excludeCorporateEntityTypes([{ value: 'candidate' }, { value: 'media' }, { value: 'Retail' }]),
    [{ value: 'candidate' }],
  );
});

test('feed retains personal/unassigned messages but excludes corporate messages', () => {
  const items = [
    { id: 'personal', entity: null },
    { id: 'political', entity: { type: 'candidate' } },
    { id: 'corporate', entity: { type: 'retail' } },
  ];
  assert.deepEqual(excludeCorporateFeedItems(items).map((item) => item.id), ['personal', 'political']);
});
