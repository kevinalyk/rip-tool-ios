import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import type { FeedFilterOptions, FeedFilters, MessageType, SelectOption } from '@/lib/api/types';

type FilterModalProps = {
  visible: boolean;
  filters: FeedFilters;
  options?: FeedFilterOptions;
  onClose: () => void;
  onApply: (filters: FeedFilters) => void;
};

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.navy : theme.surfaceMuted,
          borderColor: selected ? theme.navy : theme.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}>
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

type OptionGroupProps = {
  title: string;
  value?: string;
  options: SelectOption[];
  onChange: (value?: string) => void;
};

function OptionGroup({ title, value, options, onChange }: OptionGroupProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={styles.chipRow}>
        <Chip label="Any" selected={!value} onPress={() => onChange(undefined)} />
        {options.map((option) => (
          <Chip key={option.value} label={option.label} selected={value === option.value} onPress={() => onChange(option.value)} />
        ))}
      </View>
    </View>
  );
}

export function FilterModal({ visible, filters, options, onClose, onApply }: FilterModalProps) {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<FeedFilters>(filters);

  const messageOptions: { value: MessageType; label: string }[] = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
  ];
  const stateOptions = (options?.states || []).map((state) => ({ value: state, label: state }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close filters" hitSlop={8} onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Filter feed</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDraft({ search: filters.search })}
            style={styles.headerButton}>
            <Text style={[styles.resetText, { color: theme.red }]}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Message type</Text>
            <View style={styles.chipRow}>
              <Chip label="All" selected={!draft.messageType} onPress={() => setDraft((current) => ({ ...current, messageType: undefined }))} />
              {messageOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={draft.messageType === option.value}
                  onPress={() => setDraft((current) => ({ ...current, messageType: option.value }))}
                />
              ))}
            </View>
          </View>

          <View style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.toggleText}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Following only</Text>
              <Text style={[styles.helper, { color: theme.textMuted }]}>Show messages from entities your organization follows.</Text>
            </View>
            <Switch
              accessibilityLabel="Following only"
              value={Boolean(draft.subscriptionsOnly)}
              onValueChange={(subscriptionsOnly) => setDraft((current) => ({ ...current, subscriptionsOnly }))}
              trackColor={{ false: theme.surfaceMuted, true: theme.red }}
            />
          </View>

          <OptionGroup
            title="Party"
            value={draft.party}
            options={options?.parties || []}
            onChange={(party) => setDraft((current) => ({ ...current, party }))}
          />
          <OptionGroup
            title="Office"
            value={draft.office}
            options={options?.offices || []}
            onChange={(office) => setDraft((current) => ({ ...current, office }))}
          />
          <OptionGroup
            title="State"
            value={draft.state}
            options={stateOptions}
            onChange={(state) => setDraft((current) => ({ ...current, state }))}
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <PrimaryButton
            label="Show results"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 58,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleRow: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  toggleText: {
    flex: 1,
    gap: spacing.xs,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
});
