import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDirectoryQuery, buildFeedQuery } from '../api/query';

test('buildFeedQuery omits empty values and trims search text', () => {
  assert.equal(buildFeedQuery({ search: '  senate race  ' }), '?search=senate+race');
  assert.equal(buildFeedQuery({ search: '   ' }), '');
});

test('buildFeedQuery serializes every supported mobile feed filter', () => {
  const query = buildFeedQuery(
    {
      search: 'fundraising',
      entityIds: ['entity-1', 'entity-2'],
      party: 'republican',
      state: 'TX',
      entityType: 'politician',
      messageFilters: ['email', 'third_party'],
      donationPlatform: 'winred',
      fromDate: '2026-08-01',
      toDate: '2026-09-06',
      subscriptionsOnly: true,
    },
    'cursor-value',
  );

  const params = new URLSearchParams(query);
  assert.deepEqual(params.getAll('entityId'), ['entity-1', 'entity-2']);
  assert.deepEqual(Object.fromEntries([...params].filter(([key]) => key !== 'entityId')), {
    search: 'fundraising',
    party: 'republican',
    state: 'TX',
    entityType: 'politician',
    messageType: 'email',
    thirdParty: 'true',
    donationPlatform: 'winred',
    fromDate: '2026-08-01',
    toDate: '2026-09-06',
    subscriptionsOnly: 'true',
    cursor: 'cursor-value',
  });
});

test('buildFeedQuery treats both values in a message dimension as no restriction', () => {
  const query = buildFeedQuery({
    messageFilters: ['email', 'sms', 'third_party', 'house_file'],
  });

  const params = new URLSearchParams(query);
  assert.equal(params.has('messageType'), false);
  assert.equal(params.has('thirdParty'), false);
  assert.equal(params.has('houseFileOnly'), false);
});

test('buildFeedQuery serializes SMS and house-file selections', () => {
  assert.equal(
    buildFeedQuery({ messageFilters: ['sms', 'house_file'] }),
    '?messageType=sms&houseFileOnly=true',
  );
});

test('buildDirectoryQuery serializes submitted search, filters, and cursor', () => {
  assert.equal(
    buildDirectoryQuery(
      { search: '  Ann Wagner ', party: 'republican', state: 'MO', entityType: 'candidate' },
      'next-page',
    ),
    '?search=Ann+Wagner&party=republican&state=MO&entityType=candidate&cursor=next-page',
  );
  assert.equal(buildDirectoryQuery({ search: '   ' }), '');
});
