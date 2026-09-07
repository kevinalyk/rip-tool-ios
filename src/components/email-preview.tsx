'use dom';

import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';

type EmailPreviewProps = {
  html: string;
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
  'href',
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
    color: inherit !important;
    cursor: default !important;
    pointer-events: none !important;
    text-decoration: none !important;
  }
`;

function sanitizeEmailHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const headStyles = Array.from(parsed.head.querySelectorAll('style'))
    .map((style) => style.outerHTML)
    .join('');

  return DOMPurify.sanitize(`${headStyles}${parsed.body.innerHTML}`, {
    ADD_TAGS: ['style'],
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: interactiveAttributes,
    FORBID_TAGS: activeContentTags,
  });
}

export default function EmailPreview({ html }: EmailPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const content = document.createElement('div');
    style.textContent = emailDocumentCss;
    content.className = 'email-document';
    content.innerHTML = sanitizeEmailHtml(html);
    shadowRoot.replaceChildren(style, content);

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
    };
  }, [html]);

  return (
    <main aria-label="Email preview" className="preview-shell">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; width: 100%; }
        body { background: #ffffff; }
        .preview-shell {
          -webkit-overflow-scrolling: touch;
          background: #ffffff;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          width: 100%;
        }
        .preview-host { overflow: hidden; width: 100%; }
      `}</style>
      <div className="preview-host" ref={hostRef} />
    </main>
  );
}
