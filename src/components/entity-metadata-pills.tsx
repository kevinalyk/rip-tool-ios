import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, useAppTheme } from '@/constants/theme';
import { getEntityTypeBadgeTone, getPartyBadgeTone } from '@/lib/entity-metadata';
import { titleCase } from '@/lib/format';

type EntityMetadataPillsProps = {
  party?: string | null;
  state?: string | null;
  type?: string | null;
};

export function EntityMetadataPills({ party, state, type }: EntityMetadataPillsProps) {
  const theme = useAppTheme();
  const partyTone = getPartyBadgeTone(party);
  const entityTypeTone = getEntityTypeBadgeTone(type);
  const colors = {
    republican: { background: `${theme.red}18`, border: `${theme.red}40`, text: theme.red },
    democrat: { background: `${theme.democrat}18`, border: `${theme.democrat}40`, text: theme.democrat },
    independent: { background: '#7C3AED18', border: '#7C3AED40', text: '#7C3AED' },
    neutral: { background: theme.surfaceMuted, border: theme.border, text: theme.textMuted },
  }[partyTone];
  const typeColors = {
    nonprofit: { background: `${theme.nonprofit}18`, border: `${theme.nonprofit}40`, text: theme.nonprofit },
    stateParty: { background: `${theme.stateParty}18`, border: `${theme.stateParty}40`, text: theme.stateParty },
    neutral: { background: theme.surfaceMuted, border: theme.border, text: theme.text },
  }[entityTypeTone];

  return (
    <View style={styles.row}>
      {party ? <Pill label={titleCase(party)} background={colors.background} border={colors.border} color={colors.text} /> : null}
      {state ? <Pill label={state} background={theme.surfaceMuted} border={theme.border} color={theme.textMuted} /> : null}
      {type ? <Pill label={titleCase(type)} background={typeColors.background} border={typeColors.border} color={typeColors.text} /> : null}
    </View>
  );
}

function Pill({ label, background, border, color }: { label: string; background: string; border: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: background, borderColor: border }]}>
      <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  label: { fontSize: 10, fontWeight: '700', lineHeight: 13 },
});
