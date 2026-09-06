import type { CtaLink } from '@/lib/api/types';

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' as const }),
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function stripHtml(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/^[ \t]+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function extractCtaLinks(value?: unknown[]): CtaLink[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item === 'string' && isSafeHttpUrl(item)) return [{ url: item }];
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, unknown>;
    const candidate = record.url ?? record.href ?? record.link;
    if (typeof candidate !== 'string' || !isSafeHttpUrl(candidate)) return [];

    return [
      {
        url: candidate,
        text: typeof record.text === 'string' ? record.text : undefined,
        label: typeof record.label === 'string' ? record.label : undefined,
      },
    ];
  });
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function initials(firstName?: string | null, lastName?: string | null, email?: string): string {
  const value = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim();
  return (value || email?.[0] || 'R').toUpperCase();
}
