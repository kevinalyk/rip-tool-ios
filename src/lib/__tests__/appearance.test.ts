import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeAppearancePreference } from '@/lib/appearance';

test('appearance preference accepts supported values', () => {
  assert.equal(normalizeAppearancePreference('system'), 'system');
  assert.equal(normalizeAppearancePreference('light'), 'light');
  assert.equal(normalizeAppearancePreference('dark'), 'dark');
});

test('appearance preference fails safely to system', () => {
  assert.equal(normalizeAppearancePreference(null), 'system');
  assert.equal(normalizeAppearancePreference('midnight'), 'system');
});
