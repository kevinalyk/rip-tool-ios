import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterSelectionSheet, type FilterSelectionOption } from '@/components/filter-selection-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import type { FeedFilterOptions, FeedFilters, MessageFilter, SelectOption } from '@/lib/api/types';
import { titleCase } from '@/lib/format';
import { resolveDonationPlatformOptions } from '@/lib/select-options';

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

const FALLBACK_ENTITY_TYPES: SelectOption[] = [
  { value: 'politician', label: 'Politicians' },
  { value: 'pac', label: 'PACs' },
  { value: 'organization', label: 'Organizations' },
  { value: 'nonprofit', label: 'Nonprofits' },
  { value: 'state_party', label: 'State Parties' },
];
const FALLBACK_MESSAGE_FILTERS: SelectOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'third_party', label: 'Third Party' },
  { value: 'house_file', label: 'House File' },
];
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
  options: readonly SelectOption[];
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

function SelectionRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionRow,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.68 : 1 },
      ]}>
      <View style={[styles.selectionIcon, { backgroundColor: theme.surfaceMuted }]}>
        <Ionicons name={icon} size={21} color={theme.navy} />
      </View>
      <View style={styles.selectionText}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.selectionValue, { color: theme.textMuted }]}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={theme.textMuted} />
    </Pressable>
  );
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateValue(value?: string): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function displayDate(value?: string): string {
  if (!value) return 'Any date';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(fromDateValue(value));
}

export function FilterModal({ visible, filters, options, onClose, onApply }: FilterModalProps) {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<FeedFilters>(filters);
  const [entityPickerOpen, setEntityPickerOpen] = useState(false);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [activeDate, setActiveDate] = useState<'from' | 'to' | null>(null);

  const entityOptions = useMemo<FilterSelectionOption[]>(
    () =>
      (options?.entities || []).map((entity) => ({
        value: entity.id,
        label: entity.name,
        detail: [titleCase(entity.type), titleCase(entity.party), entity.state].filter(Boolean).join(' · '),
        isFollowing: entity.isFollowing,
      })),
    [options?.entities],
  );
  const stateOptions = useMemo<FilterSelectionOption[]>(
    () => (options?.states || []).map((state) => ({ value: state, label: state })),
    [options?.states],
  );
  const selectedEntityNames = (draft.entityIds || [])
    .map((id) => options?.entities?.find((entity) => entity.id === id)?.name)
    .filter(Boolean);
  const entityTypes = options?.entityTypes?.length ? options.entityTypes : FALLBACK_ENTITY_TYPES;
  const messageFilters = options?.messageFilters?.length ? options.messageFilters : FALLBACK_MESSAGE_FILTERS;
  const donationPlatforms = useMemo(
    () => resolveDonationPlatformOptions(options?.donationPlatforms),
    [options?.donationPlatforms],
  );

  const toggleMessageFilter = (value: MessageFilter) => {
    setDraft((current) => {
      const selected = current.messageFilters || [];
      return {
        ...current,
        messageFilters: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  };

  const changeDate = (date: Date) => {
    const value = toDateValue(date);
    setDraft((current) => {
      if (activeDate === 'from') {
        return {
          ...current,
          fromDate: value,
          toDate: current.toDate && value > current.toDate ? value : current.toDate,
        };
      }
      return { ...current, toDate: value };
    });
  };

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
            onPress={() => {
              setDraft({ search: filters.search });
              setActiveDate(null);
            }}
            style={styles.headerButton}>
            <Text style={[styles.resetText, { color: theme.red }]}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <SelectionRow
            icon="people-outline"
            title="Entities"
            value={selectedEntityNames.length ? `${selectedEntityNames.length} selected` : 'All entities'}
            onPress={() => setEntityPickerOpen(true)}
          />

          <View style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.toggleText}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Following only</Text>
              <Text style={[styles.helper, { color: theme.textMuted }]}>Only messages from entities your organization follows.</Text>
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
            title="Entity type"
            value={draft.entityType}
            options={entityTypes}
            onChange={(entityType) => setDraft((current) => ({ ...current, entityType }))}
          />

          <SelectionRow
            icon="map-outline"
            title="State"
            value={draft.state || 'All states'}
            onPress={() => setStatePickerOpen(true)}
          />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Messages</Text>
            <Text style={[styles.helper, { color: theme.textMuted }]}>Choose any combination, matching the web CI feed.</Text>
            <View style={styles.chipRow}>
              {messageFilters.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={Boolean(draft.messageFilters?.includes(option.value as MessageFilter))}
                  onPress={() => toggleMessageFilter(option.value as MessageFilter)}
                />
              ))}
            </View>
          </View>

          <OptionGroup
            title="Donation platform"
            value={draft.donationPlatform}
            options={donationPlatforms}
            onChange={(donationPlatform) => setDraft((current) => ({ ...current, donationPlatform }))}
          />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Date range</Text>
            <View style={styles.dateRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveDate(activeDate === 'from' ? null : 'from')}
                style={[
                  styles.dateButton,
                  { backgroundColor: theme.surface, borderColor: activeDate === 'from' ? theme.red : theme.border },
                ]}>
                <Text style={[styles.dateCaption, { color: theme.textMuted }]}>FROM</Text>
                <Text style={[styles.dateValue, { color: theme.text }]}>{displayDate(draft.fromDate)}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveDate(activeDate === 'to' ? null : 'to')}
                style={[
                  styles.dateButton,
                  { backgroundColor: theme.surface, borderColor: activeDate === 'to' ? theme.red : theme.border },
                ]}>
                <Text style={[styles.dateCaption, { color: theme.textMuted }]}>TO</Text>
                <Text style={[styles.dateValue, { color: theme.text }]}>{displayDate(draft.toDate)}</Text>
              </Pressable>
            </View>
            {activeDate ? (
              <View style={[styles.calendar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <DateTimePicker
                  accentColor={theme.red}
                  display="inline"
                  maximumDate={new Date()}
                  minimumDate={activeDate === 'to' && draft.fromDate ? fromDateValue(draft.fromDate) : undefined}
                  mode="date"
                  onChange={(_event, date) => date && changeDate(date)}
                  value={fromDateValue(activeDate === 'from' ? draft.fromDate : draft.toDate)}
                />
              </View>
            ) : null}
            {draft.fromDate || draft.toDate ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setDraft((current) => ({ ...current, fromDate: undefined, toDate: undefined }));
                  setActiveDate(null);
                }}
                style={styles.clearDates}>
                <Text style={[styles.clearDatesText, { color: theme.red }]}>Clear dates</Text>
              </Pressable>
            ) : null}
          </View>
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

        {entityPickerOpen ? (
          <FilterSelectionSheet
            visible
            title="Entities"
            searchPlaceholder="Search entities"
            options={entityOptions}
            selectedValues={draft.entityIds || []}
            multiple
            onClose={() => setEntityPickerOpen(false)}
            onApply={(entityIds) => setDraft((current) => ({ ...current, entityIds }))}
          />
        ) : null}
        {statePickerOpen ? (
          <FilterSelectionSheet
            visible
            title="State"
            searchPlaceholder="Search states"
            options={stateOptions}
            selectedValues={draft.state ? [draft.state] : []}
            onClose={() => setStatePickerOpen(false)}
            onApply={(states) => setDraft((current) => ({ ...current, state: states[0] }))}
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
  headerButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 58 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  resetText: { fontSize: 15, fontWeight: '700' },
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxxl },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  selectionRow: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
  },
  selectionIcon: { alignItems: 'center', borderRadius: radii.md, height: 44, justifyContent: 'center', width: 44 },
  selectionText: { flex: 1, gap: 3 },
  selectionValue: { fontSize: 13 },
  toggleRow: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  toggleText: { flex: 1, gap: spacing.xs },
  helper: { fontSize: 13, lineHeight: 18 },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateButton: { borderRadius: radii.md, borderWidth: 1, flex: 1, gap: 4, minHeight: 62, padding: spacing.md },
  dateCaption: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dateValue: { fontSize: 14, fontWeight: '600' },
  calendar: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  clearDates: { alignItems: 'center', alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 },
  clearDatesText: { fontSize: 14, fontWeight: '700' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
});
