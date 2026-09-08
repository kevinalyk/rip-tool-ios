import assert from 'node:assert/strict';
import test from 'node:test';

import { DONATION_PLATFORM_OPTIONS, resolveDonationPlatformOptions } from '../select-options';

test('processor options fall back safely when the API field is missing or malformed', () => {
  assert.deepEqual(resolveDonationPlatformOptions(undefined), DONATION_PLATFORM_OPTIONS);
  assert.deepEqual(resolveDonationPlatformOptions({ donationPlatforms: [] }), DONATION_PLATFORM_OPTIONS);
  assert.deepEqual(resolveDonationPlatformOptions([null, 4, {}, { value: 'winred' }]), DONATION_PLATFORM_OPTIONS);
});

test('processor options keep known server labels and reject unknown values', () => {
  const options = resolveDonationPlatformOptions([
    { value: ' WINRED ', label: ' WinRed Payments ' },
    { value: 'unexpected', label: 'Unsupported' },
  ]);

  assert.equal(options.length, DONATION_PLATFORM_OPTIONS.length);
  assert.deepEqual(options[0], { value: 'winred', label: 'WinRed Payments' });
  assert.equal(options.some((option) => option.value === 'unexpected'), false);
});
