import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFeedQuery } from '../api/query';

test('buildFeedQuery omits empty values and trims search text', () => {
  assert.equal(buildFeedQuery({ search: '  senate race  ' }), '?search=senate+race');
  assert.equal(buildFeedQuery({ search: '   ' }), '');
});

test('buildFeedQuery serializes every supported mobile feed filter', () => {
  const query = buildFeedQuery(
    {
      search: 'fundraising',
      party: 'republican',
      state: 'TX',
      office: 'senate',
      messageType: 'email',
      subscriptionsOnly: true,
    },
    'cursor-value',
  );

  const params = new URLSearchParams(query);
  assert.deepEqual(Object.fromEntries(params), {
    search: 'fundraising',
    party: 'republican',
    state: 'TX',
    office: 'senate',
    messageType: 'email',
    subscriptionsOnly: 'true',
    cursor: 'cursor-value',
  });
});
