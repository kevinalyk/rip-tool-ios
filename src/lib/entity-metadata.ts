export type PartyBadgeTone = 'republican' | 'democrat' | 'independent' | 'neutral';

export function getPartyBadgeTone(party?: string | null): PartyBadgeTone {
  const normalized = party?.trim().toLowerCase();
  if (normalized === 'republican' || normalized === 'gop') return 'republican';
  if (normalized === 'democrat' || normalized === 'democratic') return 'democrat';
  if (
    normalized === 'independent' ||
    normalized === 'ind' ||
    normalized === 'i' ||
    normalized === 'third party'
  ) {
    return 'independent';
  }
  return 'neutral';
}
