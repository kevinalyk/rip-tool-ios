import type { SelectOption } from '@/lib/api/types';

export const DONATION_PLATFORM_OPTIONS: readonly SelectOption[] = [
  { value: 'winred', label: 'WinRed' },
  { value: 'actblue', label: 'ActBlue' },
  { value: 'anedot', label: 'Anedot' },
  { value: 'psq', label: 'PSQ' },
  { value: 'ngpvan', label: 'NGPVAN' },
  { value: 'substack', label: 'Substack' },
];

/**
 * Treat API option data as untrusted at the render boundary. The processor list is
 * a fixed server-side allow-list, so only known values are displayed and every
 * supported value remains available if a response is missing or malformed.
 */
export function resolveDonationPlatformOptions(value: unknown): SelectOption[] {
  const received = new Map<string, SelectOption>();

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const option = item as Record<string, unknown>;
      if (typeof option.value !== 'string' || typeof option.label !== 'string') continue;

      const cleanValue = option.value.trim().toLowerCase();
      const cleanLabel = option.label.trim();
      if (!cleanValue || !cleanLabel) continue;
      received.set(cleanValue, { value: cleanValue, label: cleanLabel });
    }
  }

  return DONATION_PLATFORM_OPTIONS.map((fallback) => received.get(fallback.value) ?? { ...fallback });
}
