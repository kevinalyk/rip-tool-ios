import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveFaceIdAvailability } from '../face-id-policy';

test('Face ID is available only with hardware, enrollment, and facial recognition support', () => {
  assert.equal(
    resolveFaceIdAvailability({ hasHardware: true, isEnrolled: true, supportsFaceId: true }),
    'available',
  );
  assert.equal(
    resolveFaceIdAvailability({ hasHardware: true, isEnrolled: false, supportsFaceId: true }),
    'not-enrolled',
  );
  assert.equal(
    resolveFaceIdAvailability({ hasHardware: false, isEnrolled: true, supportsFaceId: true }),
    'unavailable',
  );
  assert.equal(
    resolveFaceIdAvailability({ hasHardware: true, isEnrolled: true, supportsFaceId: false }),
    'unavailable',
  );
});
