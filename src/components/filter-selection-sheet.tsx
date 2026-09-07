import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radii, spacing, useAppTheme } from '@/constants/theme';

export type FilterSelectionOption = {
  value: string;
  label: string;
  detail?: string;
  isFollowing?: boolean;
};

type FilterSelectionSheetProps = {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  options: FilterSelectionOption[];
  selectedValues: string[];
  multiple?: boolean;
  onClose: () => void;
  onApply: (values: string[]) => void;
};

export function FilterSelectionSheet({
  visible,
  title,
  searchPlaceholder,
  options,
  selectedValues,
  multiple = false,
  onClose,
  onApply,
}: FilterSelectionSheetProps) {
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>(selectedValues);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(query) || option.detail?.toLowerCase().includes(query),
    );
  }, [options, search]);

  const toggle = (value: string) => {
    if (!multiple) {
      setDraft(draft.includes(value) ? [] : [value]);
      return;
    }
    setDraft((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerAction, { color: theme.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={styles.headerButton}>
            <Text style={[styles.headerAction, { color: theme.red }]}>Done</Text>
          </Pressable>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={19} color={theme.textMuted} />
          <TextInput
            accessibilityLabel={searchPlaceholder}
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
          />
          {search ? (
            <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {draft.length ? (
          <Pressable accessibilityRole="button" onPress={() => setDraft([])} style={styles.clearButton}>
            <Text style={[styles.clearText, { color: theme.red }]}>Clear selection ({draft.length})</Text>
          </Pressable>
        ) : null}

        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          data={filteredOptions}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(option) => option.value}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No matching options</Text>
          }
          renderItem={({ item }) => {
            const selected = draft.includes(item.value);
            return (
              <Pressable
                accessibilityRole={multiple ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: selected }}
                onPress={() => toggle(item.value)}
                style={({ pressed }) => [
                  styles.option,
                  { borderBottomColor: theme.border, opacity: pressed ? 0.65 : 1 },
                ]}>
                <View style={styles.optionText}>
                  <View style={styles.optionTitleRow}>
                    <Text style={[styles.optionLabel, { color: theme.text }]}>{item.label}</Text>
                    {item.isFollowing ? <Ionicons name="star" size={14} color={theme.warning} /> : null}
                  </View>
                  {item.detail ? <Text style={[styles.optionDetail, { color: theme.textMuted }]}>{item.detail}</Text> : null}
                </View>
                <View
                  style={[
                    styles.selection,
                    {
                      backgroundColor: selected ? theme.red : 'transparent',
                      borderColor: selected ? theme.red : theme.border,
                      borderRadius: multiple ? 6 : 11,
                    },
                  ]}>
                  {selected ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          }}
        />
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
  headerAction: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800' },
  searchBox: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 16, minHeight: 46 },
  clearButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg },
  clearText: { fontSize: 14, fontWeight: '700' },
  listContent: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  option: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  optionText: { flex: 1, gap: 3 },
  optionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  optionLabel: { flexShrink: 1, fontSize: 16, fontWeight: '600' },
  optionDetail: { fontSize: 12, lineHeight: 17 },
  selection: {
    alignItems: 'center',
    borderWidth: 1.5,
    height: 23,
    justifyContent: 'center',
    width: 23,
  },
  emptyText: { fontSize: 15, padding: spacing.xxl, textAlign: 'center' },
});
