'use dom';

import { useMemo } from 'react';

type EmailPreviewProps = {
  html: string;
  dom?: import('expo/dom').DOMProps;
};

const previewGuard = `
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3" />
  <style>
    html, body { background: #ffffff !important; color: #111827; margin: 0 !important; min-height: 100%; }
    body { box-sizing: border-box; overflow-wrap: anywhere; padding: 12px !important; }
    img { height: auto !important; max-width: 100% !important; }
    table { max-width: 100% !important; }
    a { color: inherit !important; cursor: default !important; pointer-events: none !important; text-decoration: none !important; }
    form, input, button, select, textarea { pointer-events: none !important; }
  </style>
`;

function prepareEmailHtml(html: string): string {
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${previewGuard}`);
  }
  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${previewGuard}</head>`);
  }
  return `<!doctype html><html><head>${previewGuard}</head><body>${html}</body></html>`;
}

export default function EmailPreview({ html }: EmailPreviewProps) {
  const document = useMemo(() => prepareEmailHtml(html), [html]);

  return (
    <main aria-label="Email preview" className="preview-shell">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root, .preview-shell { height: 100%; margin: 0; width: 100%; }
        body { background: #ffffff; }
        .preview-shell { overflow: hidden; }
        iframe { background: #ffffff; border: 0; display: block; height: 100%; width: 100%; }
      `}</style>
      <iframe referrerPolicy="no-referrer" sandbox="" srcDoc={document} title="Email preview" />
    </main>
  );
}
