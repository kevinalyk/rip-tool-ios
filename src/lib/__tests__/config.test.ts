import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeApiBaseUrl } from '../api/config';

test('normalizeApiBaseUrl accepts an HTTPS origin or the exact mobile namespace', () => {
  assert.equal(normalizeApiBaseUrl('https://preview.example.com'), 'https://preview.example.com/api/mobile/v1');
  assert.equal(
    normalizeApiBaseUrl('https://preview.example.com/api/mobile/v1/'),
    'https://preview.example.com/api/mobile/v1',
  );
  assert.equal(normalizeApiBaseUrl('http://localhost:3000'), 'http://localhost:3000/api/mobile/v1');
});

test('normalizeApiBaseUrl fails closed for unsafe or ambiguous configuration', () => {
  const rejected = [
    'http://preview.example.com',
    'https://user:password@preview.example.com',
    'https://preview.example.com/api/other',
    'https://preview.example.com?token=secret',
    'not a url',
  ];

  for (const value of rejected) {
    assert.throws(() => normalizeApiBaseUrl(value));
  }
});
