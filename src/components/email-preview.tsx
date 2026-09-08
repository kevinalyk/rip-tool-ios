'use dom';

import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';

import type { CtaLink } from '@/lib/api/types';

type EmailPreviewProps = {
  html: string;
  links: CtaLink[];
  openLink: (url: string) => Promise<void>;
  dom?: import('expo/dom').DOMProps;
};

const activeContentTags = [
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

const interactiveAttributes = [
  'action',
  'download',
  'formaction',
  'ping',
  'srcdoc',
  'target',
  'xlink:href',
];

const emailDocumentCss = `
  :host { background: #ffffff; color: #111827; display: block; min-height: 100%; width: 100%; }
  * { box-sizing: border-box; }
  .email-document {
    background: #ffffff;
    color: #111827;
    min-height: 100%;
    overflow-wrap: anywhere;
    padding: 12px;
    width: 100%;
  }
  img { height: auto !important; max-width: 100% !important; }
  table { max-width: 100% !important; }
  a {
    color: #2563eb !important;
    cursor: pointer !important;
    text-decoration: underline !important;
  }
  a:not([href]) { color: inherit !important; cursor: default !important; text-decoration: none !important; }
`;

function sanitizeEmailHtml(html: string, links: CtaLink[]): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const headStyles = Array.from(parsed.head.querySelectorAll('style'))
    .map((style) => style.outerHTML)
    .join('');

  const destinationsByCapturedUrl = new Map<string, string>();
  for (const link of links) {
    destinationsByCapturedUrl.set(link.url, link.url);
    if (link.originalUrl) destinationsByCapturedUrl.set(link.originalUrl, link.url);
  }

  parsed.body.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const capturedUrl = anchor.getAttribute('href')?.trim();
    const destinationUrl = capturedUrl ? destinationsByCapturedUrl.get(capturedUrl) : undefined;
    if (destinationUrl) anchor.setAttribute('href', destinationUrl);
    else anchor.removeAttribute('href');
  });

  return DOMPurify.sanitize(`${headStyles}${parsed.body.innerHTML}`, {
    ADD_TAGS: ['style'],
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: interactiveAttributes,
    FORBID_TAGS: activeContentTags,
  });
}

export default function EmailPreview({ html, links, openLink }: EmailPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const content = document.createElement('div');
    style.textContent = emailDocumentCss;
    content.className = 'email-document';
    content.innerHTML = sanitizeEmailHtml(html, links);
    shadowRoot.replaceChildren(style, content);

    const allowedDestinations = new Set(links.map((link) => link.url));
    const handleLinkClick = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;

      event.preventDefault();
      const destinationUrl = anchor.getAttribute('href');
      if (destinationUrl && allowedDestinations.has(destinationUrl)) void openLink(destinationUrl);
    };
    content.addEventListener('click', handleLinkClick);

    let animationFrame = 0;
    const fitToViewport = () => {
      content.style.transform = '';
      content.style.transformOrigin = '';
      content.style.width = '100%';
      host.style.height = 'auto';

      const availableWidth = Math.max(host.clientWidth, 1);
      const contentWidth = Math.max(content.scrollWidth, availableWidth);
      const scale = Math.min(1, availableWidth / contentWidth);

      if (scale < 1) {
        content.style.transform = `scale(${scale})`;
        content.style.transformOrigin = 'top left';
        content.style.width = `${contentWidth}px`;
      }
      host.style.height = `${Math.ceil(content.scrollHeight * scale)}px`;
    };
    const scheduleFit = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(fitToViewport);
    };

    const images = Array.from(content.querySelectorAll('img'));
    images.forEach((image) => {
      image.addEventListener('load', scheduleFit);
      image.addEventListener('error', scheduleFit);
    });
    window.addEventListener('resize', scheduleFit);
    scheduleFit();

    return () => {
      cancelAnimationFrame(animationFrame);
      images.forEach((image) => {
        image.removeEventListener('load', scheduleFit);
        image.removeEventListener('error', scheduleFit);
      });
      window.removeEventListener('resize', scheduleFit);
      content.removeEventListener('click', handleLinkClick);
    };
  }, [html, links, openLink]);

  return (
    <main aria-label="Email preview" className="preview-shell">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; width: 100%; }
        body { background: #ffffff; }
        .preview-shell {
          background: #ffffff;
          overflow-x: hidden;
          min-height: 100%;
          width: 100%;
        }
        .preview-host { overflow: hidden; width: 100%; }
      `}</style>
      <div className="preview-host" ref={hostRef} />
    </main>
  );
}
