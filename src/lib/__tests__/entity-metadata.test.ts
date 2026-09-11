import assert from 'node:assert/strict';
import test from 'node:test';

import { getEntityTypeBadgeTone, getPartyBadgeTone } from '../entity-metadata';

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

test('entity-type badge tones recognize new web entity types and aliases', () => {
  assert.equal(getEntityTypeBadgeTone('nonprofit'), 'nonprofit');
  assert.equal(getEntityTypeBadgeTone('Foundation'), 'nonprofit');
  assert.equal(getEntityTypeBadgeTone('state_party'), 'stateParty');
  assert.equal(getEntityTypeBadgeTone('State Party'), 'stateParty');
});

test('other entity types retain the neutral treatment', () => {
  assert.equal(getEntityTypeBadgeTone('candidate'), 'neutral');
  assert.equal(getEntityTypeBadgeTone(null), 'neutral');
});
