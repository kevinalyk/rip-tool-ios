import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EntityAvatar } from '@/components/entity-avatar';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import type { FeedItem } from '@/lib/api/types';
import { formatDate, titleCase } from '@/lib/format';

type FeedCardProps = {
  item: FeedItem;
  onPress: () => void;
};

export function FeedCard({ item, onPress }: FeedCardProps) {
  const theme = useAppTheme();
  const entityName = item.entity?.name || item.senderName || 'Unknown sender';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.type === 'sms' ? 'Text' : 'Email'} from ${entityName}: ${item.subject}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
      ]}>
      <View style={styles.topRow}>
        <EntityAvatar name={entityName} imageUrl={item.entity?.imageUrl} />
        <View style={styles.senderBlock}>
          <Text numberOfLines={1} style={[styles.sender, { color: theme.text }]}>{entityName}</Text>
          <Text numberOfLines={1} style={[styles.meta, { color: theme.textMuted }]}>
            {item.entity ? [titleCase(item.entity.party), item.entity.state].filter(Boolean).join(' · ') : item.senderEmail}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'sms' ? `${theme.blue}20` : `${theme.red}18` }]}>
          <Ionicons name={item.type === 'sms' ? 'chatbubble-outline' : 'mail-outline'} size={14} color={item.type === 'sms' ? theme.blue : theme.red} />
          <Text style={[styles.typeText, { color: item.type === 'sms' ? theme.blue : theme.red }]}>{item.type === 'sms' ? 'SMS' : 'EMAIL'}</Text>
        </View>
      </View>

      <Text numberOfLines={3} style={[styles.subject, { color: theme.text }]}>{item.subject || 'No subject'}</Text>

      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(item.dateReceived)}</Text>
        {item.type === 'email' ? (
          <View style={styles.rate}>
            <View style={[styles.rateDot, { backgroundColor: item.inboxRate >= 80 ? theme.success : theme.warning }]} />
            <Text style={[styles.date, { color: theme.textMuted }]}>{Math.round(item.inboxRate)}% inbox</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

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
  rate: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rateDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
});
