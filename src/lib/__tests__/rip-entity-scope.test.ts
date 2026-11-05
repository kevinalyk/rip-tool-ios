import assert from 'node:assert/strict';
import test from 'node:test';

import {
  excludeCorporateEntities,
  excludeCorporateFeedItems,
  isCorporateEntity,
} from '@/lib/rip-entity-scope';

test('only the isCorporate flag determines corporate visibility', () => {
  assert.equal(isCorporateEntity({ type: 'organization', isCorporate: true }), true);
  assert.equal(isCorporateEntity({ type: 'media', isCorporate: false }), false);
  assert.equal(isCorporateEntity({ type: 'retail' }), false);
  assert.equal(isCorporateEntity({ type: 'state_party', isCorporate: false }), false);
  assert.equal(isCorporateEntity(null), false);
});

test('entity lists and filter choices omit corporate entities', () => {
  const entities = [
    { id: 'political', type: 'candidate' },
    { id: 'media', type: 'media', isCorporate: false },
    { id: 'flagged', type: 'organization', isCorporate: true },
  ];
  assert.deepEqual(excludeCorporateEntities(entities).map((entity) => entity.id), ['political', 'media']);
});

test('feed retains personal/unassigned messages but excludes corporate messages', () => {
  const items = [
    { id: 'personal', entity: null },
    { id: 'political', entity: { type: 'candidate' } },
    { id: 'corporate', entity: { type: 'organization', isCorporate: true } },
    { id: 'unflagged-retail', entity: { type: 'retail', isCorporate: false } },
  ];
  assert.deepEqual(excludeCorporateFeedItems(items).map((item) => item.id), ['personal', 'political', 'unflagged-retail']);
});
