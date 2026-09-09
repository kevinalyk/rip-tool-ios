import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterSelectionSheet, type FilterSelectionOption } from '@/components/filter-selection-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import type { DirectoryFilters, DirectoryOptions, SelectOption } from '@/lib/api/types';

type DirectoryFilterModalProps = {
  visible: boolean;
  filters: DirectoryFilters;
  options?: DirectoryOptions;
  onClose: () => void;
  onApply: (filters: DirectoryFilters) => void;
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.navy : theme.surface,
          borderColor: selected ? theme.navy : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

function OptionGroup({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value?: string;
  options: SelectOption[];
  onChange: (value?: string) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={styles.chips}>
        <Chip label="Any" selected={!value} onPress={() => onChange(undefined)} />
        {options.map((option) => (
          <Chip key={option.value} label={option.label} selected={value === option.value} onPress={() => onChange(option.value)} />
        ))}
      </View>
    </View>
  );
}

export function DirectoryFilterModal({ visible, filters, options, onClose, onApply }: DirectoryFilterModalProps) {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<DirectoryFilters>(filters);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const stateOptions = useMemo<FilterSelectionOption[]>(
    () => [
      ...(options?.states || []).map((state) => ({ value: state, label: state })),
      { value: 'unknown', label: 'Unknown' },
    ],
    [options?.states],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close filters" onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Filter directory</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDraft({ search: filters.search })}
            style={styles.headerButton}>
            <Text style={[styles.resetText, { color: theme.red }]}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
          <OptionGroup
            title="Party"
            value={draft.party}
            options={options?.parties || []}
            onChange={(party) => setDraft((current) => ({ ...current, party }))}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setStatePickerOpen(true)}
            style={({ pressed }) => [
              styles.selectionRow,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}>
            <View style={[styles.selectionIcon, { backgroundColor: theme.surfaceMuted }]}>
              <Ionicons name="map-outline" size={21} color={theme.navy} />
            </View>
            <View style={styles.selectionCopy}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>State</Text>
              <Text style={[styles.selectionValue, { color: theme.textMuted }]}>{draft.state || 'All states'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={theme.textMuted} />
          </Pressable>

          <OptionGroup
            title="Entity type"
            value={draft.entityType}
            options={options?.entityTypes || []}
            onChange={(entityType) => setDraft((current) => ({ ...current, entityType }))}
          />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <PrimaryButton
            label="Show entities"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>

        {statePickerOpen ? (
          <FilterSelectionSheet
            visible
            title="State"
            searchPlaceholder="Search states"
            options={stateOptions}
            selectedValues={draft.state ? [draft.state] : []}
            onClose={() => setStatePickerOpen(false)}
            onApply={(values) => setDraft((current) => ({ ...current, state: values[0] }))}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.sm,
  },
  headerButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 68 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  resetText: { fontSize: 15, fontWeight: '700' },
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  selectionRow: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    padding: spacing.md,
  },
  selectionIcon: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  selectionCopy: { flex: 1 },
  selectionValue: { fontSize: 13, marginTop: 3 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
});
