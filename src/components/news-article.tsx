'use dom';

import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';

type NewsArticleProps = {
  html: string;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  openLink: (url: string) => Promise<void>;
  dom?: import('expo/dom').DOMProps;
};

const ACTIVE_CONTENT_TAGS = [
  'applet',
  'audio',
  'base',
  'button',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'input',
  'link',
  'meta',
  'noscript',
  'object',
  'option',
  'script',
  'select',
  'source',
  'textarea',
  'video',
];

const INTERACTIVE_ATTRIBUTES = [
  'action',
  'download',
  'formaction',
  'ping',
  'srcdoc',
  'target',
  'xlink:href',
];

const WEB_NEWS_ORIGIN = 'https://app.rip-tool.com';

function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value, WEB_NEWS_ORIGIN);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function sanitizeArticleHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  parsed.body.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const safeUrl = safeWebUrl(anchor.getAttribute('href') || '');
    if (safeUrl) anchor.setAttribute('href', safeUrl);
    else anchor.removeAttribute('href');
  });

  parsed.body.querySelectorAll<HTMLImageElement>('img[src]').forEach((image) => {
    const safeUrl = safeWebUrl(image.getAttribute('src') || '');
    if (safeUrl) image.setAttribute('src', safeUrl);
    else image.remove();
  });

  return DOMPurify.sanitize(parsed.body.innerHTML, {
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: INTERACTIVE_ATTRIBUTES,
    FORBID_TAGS: ACTIVE_CONTENT_TAGS,
  });
}

export default function NewsArticle({
  html,
  backgroundColor,
  textColor,
  mutedColor,
  accentColor,
  openLink,
}: NewsArticleProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const article = document.createElement('article');
    article.className = 'article';
    article.innerHTML = sanitizeArticleHtml(html);
    host.replaceChildren(article);

    const handleLinkClick = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;

      event.preventDefault();
      const url = safeWebUrl(anchor.getAttribute('href') || '');
      if (url) void openLink(url);
    };
    article.addEventListener('click', handleLinkClick);

    return () => article.removeEventListener('click', handleLinkClick);
  }, [html, openLink]);

  return (
    <main aria-label="Product update" className="article-shell">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; width: 100%; }
        body { background: ${backgroundColor}; color: ${textColor}; }
        .article-shell { background: ${backgroundColor}; min-height: 100%; width: 100%; }
        .article {
          color: ${textColor};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 17px;
          line-height: 1.58;
          overflow-wrap: anywhere;
          padding: 20px;
        }
        .article > :first-child { margin-top: 0; }
        .article > :last-child { margin-bottom: 0; }
        h1, h2, h3, h4 { color: ${textColor}; line-height: 1.2; margin: 1.35em 0 0.55em; }
        h1 { font-size: 28px; } h2 { font-size: 24px; } h3 { font-size: 20px; }
        p, ul, ol, blockquote { margin: 0 0 1em; }
        ul, ol { padding-left: 1.4em; }
        blockquote { border-left: 4px solid ${accentColor}; color: ${mutedColor}; padding-left: 14px; }
        a { color: ${accentColor}; font-weight: 600; text-decoration: underline; }
        a:not([href]) { color: inherit; text-decoration: none; }
        img { border-radius: 12px; display: block; height: auto !important; margin: 18px auto; max-width: 100% !important; }
        hr { border: 0; border-top: 1px solid ${mutedColor}; margin: 24px 0; opacity: 0.35; }
      `}</style>
      <div ref={hostRef} />
    </main>
  );
}
