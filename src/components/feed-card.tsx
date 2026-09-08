import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EntityAvatar } from '@/components/entity-avatar';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import type { FeedItem } from '@/lib/api/types';
import { getPartyBadgeTone } from '@/lib/entity-metadata';
import { formatDate, titleCase } from '@/lib/format';

type FeedCardProps = {
  item: FeedItem;
  onPress: (item: FeedItem) => void;
};

export const FeedCard = memo(function FeedCard({ item, onPress }: FeedCardProps) {
  const theme = useAppTheme();
  const entityName = item.entity?.name || item.senderName || 'Unknown sender';
  const partyTone = getPartyBadgeTone(item.entity?.party);
  const partyColors = {
    republican: { background: `${theme.red}18`, border: `${theme.red}40`, text: theme.red },
    democrat: { background: `${theme.blue}18`, border: `${theme.blue}40`, text: theme.blue },
    independent: { background: '#7C3AED18', border: '#7C3AED40', text: '#7C3AED' },
    neutral: { background: theme.surfaceMuted, border: theme.border, text: theme.textMuted },
  }[partyTone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.type === 'sms' ? 'Text' : 'Email'} from ${entityName}: ${item.subject}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
      ]}>
      <View style={styles.topRow}>
        <EntityAvatar name={entityName} imageUrl={item.entity?.imageUrl} />
        <View style={styles.senderBlock}>
          <Text numberOfLines={1} style={[styles.sender, { color: theme.text }]}>{entityName}</Text>
          {item.entity ? (
            <View style={styles.metadataRow}>
              {item.entity.party ? (
                <View style={[styles.metadataPill, { backgroundColor: partyColors.background, borderColor: partyColors.border }]}>
                  <Text numberOfLines={1} style={[styles.metadataPillText, { color: partyColors.text }]}>
                    {titleCase(item.entity.party)}
                  </Text>
                </View>
              ) : null}
              {item.entity.state ? (
                <View style={[styles.metadataPill, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                  <Text style={[styles.metadataPillText, { color: theme.textMuted }]}>{item.entity.state}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text numberOfLines={1} style={[styles.meta, { color: theme.textMuted }]}>{item.senderEmail}</Text>
          )}
        </View>
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'sms' ? `${theme.blue}20` : `${theme.red}18` }]}>
          <Ionicons name={item.type === 'sms' ? 'chatbubble-outline' : 'mail-outline'} size={14} color={item.type === 'sms' ? theme.blue : theme.red} />
          <Text style={[styles.typeText, { color: item.type === 'sms' ? theme.blue : theme.red }]}>{item.type === 'sms' ? 'SMS' : 'EMAIL'}</Text>
        </View>
      </View>

      <Text numberOfLines={3} style={[styles.subject, { color: theme.text }]}>{item.subject || 'No subject'}</Text>

      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(item.dateReceived)}</Text>
        <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  senderBlock: {
    flex: 1,
  },
  sender: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  metadataPill: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  metadataPillText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  typeBadge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subject: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
});
