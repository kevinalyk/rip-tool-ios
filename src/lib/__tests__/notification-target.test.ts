import assert from 'node:assert/strict';
import test from 'node:test';

import { decodeNotificationTarget } from '@/lib/notification-target';

test('decodes feed notification targets', () => {
  assert.deepEqual(
    decodeNotificationTarget({ feedItemId: 'message-1', messageType: 'email' }),
    { kind: 'feed', feedItemId: 'message-1', messageType: 'email' },
  );
});

test('decodes announcement notification targets', () => {
  assert.deepEqual(
    decodeNotificationTarget({ announcementSlug: 'new-mobile-feature' }),
    { kind: 'announcement', slug: 'new-mobile-feature' },
  );
});

test('decodes account-access notification targets', () => {
  assert.deepEqual(
    decodeNotificationTarget({ accountAccessKind: 'covered', shouldCancelAppleSubscription: true }),
    { kind: 'account-access', accessKind: 'covered', shouldCancelAppleSubscription: true },
  );
  assert.deepEqual(
    decodeNotificationTarget({ accountAccessKind: 'web_ready', shouldCancelAppleSubscription: false }),
    { kind: 'account-access', accessKind: 'web_ready', shouldCancelAppleSubscription: false },
  );
});

test('rejects malformed notification targets', () => {
  assert.equal(decodeNotificationTarget(null), null);
  assert.equal(decodeNotificationTarget({ feedItemId: 'message-1', messageType: 'push' }), null);
  assert.equal(decodeNotificationTarget({ announcementSlug: '' }), null);
});
