export type PartyBadgeTone = 'republican' | 'democrat' | 'independent' | 'neutral';
export type EntityTypeBadgeTone = 'nonprofit' | 'stateParty' | 'neutral';

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

export function getEntityTypeBadgeTone(type?: string | null): EntityTypeBadgeTone {
  const normalized = type?.trim().toLowerCase().replace(/[ -]+/g, '_');
  if (normalized === 'nonprofit' || normalized === 'foundation') return 'nonprofit';
  if (normalized === 'state_party') return 'stateParty';
  return 'neutral';
}
