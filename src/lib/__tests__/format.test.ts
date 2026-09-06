import assert from 'node:assert/strict';
import test from 'node:test';

import { extractCtaLinks, isSafeHttpUrl, stripHtml, titleCase } from '../format';

test('stripHtml removes executable content and preserves readable paragraphs', () => {
  const source = '<style>.hidden{display:none}</style><p>Hello &amp; welcome.</p><script>alert(1)</script><p>Second line<br>Now</p>';
  assert.equal(stripHtml(source), 'Hello & welcome.\n\nSecond line\nNow');
});

test('extractCtaLinks accepts only safe http and https targets', () => {
  const links = extractCtaLinks([
    'https://example.com/donate',
    { href: 'http://example.com/event', label: 'Event' },
    { url: 'javascript:alert(1)', text: 'Unsafe' },
    { link: 'not-a-url' },
  ]);

  assert.deepEqual(links, [
    { url: 'https://example.com/donate' },
    { url: 'http://example.com/event', label: 'Event', text: undefined },
  ]);
  assert.equal(isSafeHttpUrl('file:///etc/passwd'), false);
});

test('titleCase formats API enum values', () => {
  assert.equal(titleCase('super_admin'), 'Super Admin');
  assert.equal(titleCase(null), '');
});
