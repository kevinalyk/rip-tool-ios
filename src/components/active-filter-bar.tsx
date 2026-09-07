import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, useAppTheme } from '@/constants/theme';
import type { FeedFilterOptions, FeedFilters, MessageFilter } from '@/lib/api/types';
import { titleCase } from '@/lib/format';

type ActiveFilterBarProps = {
  filters: FeedFilters;
  options?: FeedFilterOptions;
  onChange: (filters: FeedFilters) => void;
};

type ActiveChip = {
  key: string;
  label: string;
  remove: () => void;
};

const FALLBACK_MESSAGE_LABELS: Record<MessageFilter, string> = {
  email: 'Email',
  sms: 'SMS',
  third_party: 'Third Party',
  house_file: 'House File',
};

export function ActiveFilterBar({ filters, options, onChange }: ActiveFilterBarProps) {
  const theme = useAppTheme();
  const entityById = useMemo(
    () => new Map((options?.entities || []).map((entity) => [entity.id, entity])),
    [options?.entities],
  );
  const chips: ActiveChip[] = [];

  for (const entityId of filters.entityIds || []) {
    const entity = entityById.get(entityId);
    chips.push({
      key: `entity:${entityId}`,
      label: entity?.name || 'Entity',
      remove: () => onChange({ ...filters, entityIds: filters.entityIds?.filter((id) => id !== entityId) }),
    });
  }

  if (filters.party) {
    chips.push({
      key: 'party',
      label: options?.parties?.find((item) => item.value === filters.party)?.label || titleCase(filters.party),
      remove: () => onChange({ ...filters, party: undefined }),
    });
  }
  if (filters.entityType) {
    chips.push({
      key: 'entityType',
      label:
        options?.entityTypes?.find((item) => item.value === filters.entityType)?.label ||
        titleCase(filters.entityType),
      remove: () => onChange({ ...filters, entityType: undefined }),
    });
  }
  if (filters.state) {
    chips.push({ key: 'state', label: filters.state, remove: () => onChange({ ...filters, state: undefined }) });
  }
  for (const messageFilter of filters.messageFilters || []) {
    chips.push({
      key: `message:${messageFilter}`,
      label:
        options?.messageFilters?.find((item) => item.value === messageFilter)?.label ||
        FALLBACK_MESSAGE_LABELS[messageFilter],
      remove: () => onChange({
        ...filters,
        messageFilters: filters.messageFilters?.filter((item) => item !== messageFilter),
      }),
    });
  }
  if (filters.donationPlatform) {
    chips.push({
      key: 'donationPlatform',
      label:
        options?.donationPlatforms?.find((item) => item.value === filters.donationPlatform)?.label ||
        titleCase(filters.donationPlatform),
      remove: () => onChange({ ...filters, donationPlatform: undefined }),
    });
  }
  if (filters.fromDate || filters.toDate) {
    const label = filters.fromDate && filters.toDate
      ? `${filters.fromDate} – ${filters.toDate}`
      : filters.fromDate
        ? `From ${filters.fromDate}`
        : `Through ${filters.toDate}`;
    chips.push({
      key: 'date',
      label,
      remove: () => onChange({ ...filters, fromDate: undefined, toDate: undefined }),
    });
  }
  if (filters.subscriptionsOnly) {
    chips.push({
      key: 'following',
      label: 'Following only',
      remove: () => onChange({ ...filters, subscriptionsOnly: undefined }),
    });
  }

  if (!chips.length) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.chipRow}
        showsHorizontalScrollIndicator={false}>
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${chip.label} filter`}
            onPress={chip.remove}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: theme.navy, opacity: pressed ? 0.68 : 1 },
            ]}>
            <Text numberOfLines={1} style={styles.chipText}>{chip.label}</Text>
            <Ionicons name="close" size={15} color="#FFFFFF" />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange({})}
          style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.62 : 1 }]}>
          <Text style={[styles.clearText, { color: theme.red }]}>Clear all</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: -spacing.lg, marginTop: spacing.md },
  chipRow: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 5,
    maxWidth: 220,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  chipText: { color: '#FFFFFF', flexShrink: 1, fontSize: 12, fontWeight: '700' },
  clearButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  clearText: { fontSize: 13, fontWeight: '700' },
});
