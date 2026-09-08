import assert from 'node:assert/strict';
import test from 'node:test';

import { getPartyBadgeTone } from '../entity-metadata';

test('party badge tones recognize API aliases', () => {
  assert.equal(getPartyBadgeTone('Republican'), 'republican');
  assert.equal(getPartyBadgeTone('GOP'), 'republican');
  assert.equal(getPartyBadgeTone('Democratic'), 'democrat');
  assert.equal(getPartyBadgeTone('ind'), 'independent');
  assert.equal(getPartyBadgeTone('Third Party'), 'independent');
});

test('party badge tones fail to a neutral treatment', () => {
  assert.equal(getPartyBadgeTone(null), 'neutral');
  assert.equal(getPartyBadgeTone('Libertarian'), 'neutral');
});
