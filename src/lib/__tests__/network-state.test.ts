import assert from 'node:assert/strict';
import test from 'node:test';

import { isNetworkOnline } from '@/lib/network-state';

test('network is offline when the device or internet is known to be unavailable', () => {
  assert.equal(isNetworkOnline(false, null), false);
  assert.equal(isNetworkOnline(true, false), false);
});

test('network stays provisionally online while reachability is being determined', () => {
  assert.equal(isNetworkOnline(null, null), true);
  assert.equal(isNetworkOnline(true, null), true);
  assert.equal(isNetworkOnline(true, true), true);
});
