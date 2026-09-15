import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import type { FeedFilters, SavedFeedView } from '@/lib/api/types';

type SavedViewsModalProps = {
  visible: boolean;
  views: SavedFeedView[];
  loading: boolean;
  creating: boolean;
  canSaveCurrentView: boolean;
  error?: string;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onRetry: () => void;
  onSelect: (view: SavedFeedView) => void;
};

function describeFilters(filters: FeedFilters): string {
  const labels: string[] = [];
  if (filters.search) labels.push(`“${filters.search}”`);
  if (filters.entityIds?.length) labels.push(`${filters.entityIds.length} ${filters.entityIds.length === 1 ? 'entity' : 'entities'}`);
  if (filters.party) labels.push(filters.party);
  if (filters.state) labels.push(filters.state);
  if (filters.entityType) labels.push(filters.entityType.replaceAll('_', ' '));
  if (filters.messageFilters?.length) labels.push(filters.messageFilters.map((item) => item.replaceAll('_', ' ')).join(' + '));
  if (filters.donationPlatform) labels.push(filters.donationPlatform);
  if (filters.subscriptionsOnly) labels.push('following only');
  if (filters.fromDate || filters.toDate) labels.push('date range');
  return labels.length ? labels.join(' · ') : 'All messages';
}

export function SavedViewsModal({
  visible,
  views,
  loading,
  creating,
  canSaveCurrentView,
  error,
  onClose,
  onCreate,
  onRetry,
  onSelect,
}: SavedViewsModalProps) {
  const theme = useAppTheme();
  const [name, setName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);

  async function saveCurrentView() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError('Give this view a name first.');
      return;
    }

    setSaveError(null);
    setSavedName(null);
    try {
      await onCreate(trimmedName);
      setName('');
      setSavedName(trimmedName);
    } catch (creationError) {
      setSaveError(creationError instanceof Error ? creationError.message : 'Couldn’t save this view.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Saved views</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close saved views" hitSlop={8} onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled">
          <View style={[styles.saveCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.saveHeading}>
              <View style={[styles.icon, { backgroundColor: `${theme.red}12` }]}>
                <Ionicons name="bookmark-outline" size={21} color={theme.red} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.saveTitle, { color: theme.text }]}>Save current view</Text>
                <Text style={[styles.summary, { color: theme.textMuted }]}>Make the search and filters currently applied available to your organization.</Text>
              </View>
            </View>

            <TextInput
              accessibilityLabel="Saved view name"
              autoCapitalize="sentences"
              editable={canSaveCurrentView && !creating}
              maxLength={80}
              onChangeText={(value) => {
                setName(value);
                setSaveError(null);
                setSavedName(null);
              }}
              onSubmitEditing={() => void saveCurrentView()}
              placeholder="View name"
              placeholderTextColor={theme.textMuted}
              returnKeyType="done"
              style={[styles.nameInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              value={name}
            />
            {!canSaveCurrentView ? (
              <Text style={[styles.feedback, { color: theme.textMuted }]}>Apply a search or at least one filter before saving.</Text>
            ) : saveError ? (
              <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.danger }]}>{saveError}</Text>
            ) : savedName ? (
              <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.success }]}>“{savedName}” is now available to your organization.</Text>
            ) : null}
            <PrimaryButton
              disabled={!canSaveCurrentView || !name.trim()}
              label="Save view"
              loading={creating}
              onPress={() => void saveCurrentView()}
              style={styles.saveButton}
            />
          </View>

          <Text style={[styles.listTitle, { color: theme.text }]}>Your organization’s views</Text>
          <Text style={[styles.helper, { color: theme.textMuted }]}>Choose a view to apply its saved search and filters.</Text>

          {loading ? (
            <ActivityIndicator color={theme.red} style={styles.loading} />
          ) : error ? (
            <View style={[styles.messageCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>Couldn’t load saved views</Text>
              <Text style={[styles.summary, { color: theme.textMuted }]}>{error}</Text>
              <PrimaryButton label="Try again" onPress={onRetry} variant="secondary" />
            </View>
          ) : views.length === 0 ? (
            <View style={[styles.messageCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>No saved views yet</Text>
              <Text style={[styles.summary, { color: theme.textMuted }]}>Apply filters to the feed and save your first view above.</Text>
            </View>
          ) : (
            views.map((view) => (
              <Pressable
                key={view.id}
                accessibilityRole="button"
                accessibilityLabel={`Apply saved view ${view.name}`}
                onPress={() => onSelect(view)}
                style={({ pressed }) => [
                  styles.viewRow,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.68 : 1 },
                ]}>
                <View style={[styles.icon, { backgroundColor: `${theme.red}12` }]}>
                  <Ionicons name="eye-outline" size={21} color={theme.red} />
                </View>
                <View style={styles.copy}>
                  <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>{view.name}</Text>
                  <Text numberOfLines={2} style={[styles.summary, { color: theme.textMuted }]}>{describeFilters(view.filters)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color={theme.textMuted} />
              </Pressable>
            ))
          )}
        </ScrollView>
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
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  headerSpacer: { width: 44 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxxl },
  saveCard: {
    borderCurve: 'continuous',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg,
  },
  saveHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  saveTitle: { fontSize: 16, fontWeight: '800' },
  nameInput: {
    borderCurve: 'continuous',
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  saveButton: { minHeight: 48 },
  feedback: { fontSize: 12, lineHeight: 18 },
  listTitle: { fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  helper: { fontSize: 13, lineHeight: 19 },
  loading: { padding: spacing.xl },
  messageCard: {
    borderCurve: 'continuous',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg,
  },
  messageTitle: { fontSize: 15, fontWeight: '800' },
  viewRow: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 76,
    padding: spacing.md,
  },
  icon: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  copy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800' },
  summary: { fontSize: 12, lineHeight: 17, marginTop: 3 },
});
