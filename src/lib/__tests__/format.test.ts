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
    {
      url: 'http://example.com/event',
      finalUrl: undefined,
      label: 'Event',
      originalUrl: undefined,
      text: undefined,
    },
  ]);
  assert.equal(isSafeHttpUrl('file:///etc/passwd'), false);
});

test('extractCtaLinks prefers finalUrl while retaining the captured URL for email-link matching', () => {
  assert.deepEqual(
    extractCtaLinks([
      {
        url: 'https://tracking.example/click/123',
        finalUrl: 'https://destination.example/donate',
        type: 'donation',
      },
    ]),
    [
      {
        url: 'https://destination.example/donate',
        finalUrl: 'https://destination.example/donate',
        originalUrl: 'https://tracking.example/click/123',
        text: undefined,
        label: undefined,
      },
    ],
  );
});

test('extractCtaLinks supports JSON-encoded CTA arrays and rejects an unsafe finalUrl', () => {
  assert.deepEqual(
    extractCtaLinks(
      JSON.stringify([
        { url: 'https://safe.example/original', finalUrl: 'javascript:alert(1)' },
        { url: 'javascript:alert(2)', finalUrl: 'https://safe.example/final' },
      ]),
    ),
    [
      {
        url: 'https://safe.example/original',
        finalUrl: undefined,
        originalUrl: undefined,
        text: undefined,
        label: undefined,
      },
      {
        url: 'https://safe.example/final',
        finalUrl: 'https://safe.example/final',
        originalUrl: undefined,
        text: undefined,
        label: undefined,
      },
    ],
  );
});

test('titleCase formats API enum values', () => {
  assert.equal(titleCase('super_admin'), 'Super Admin');
  assert.equal(titleCase(null), '');
});
