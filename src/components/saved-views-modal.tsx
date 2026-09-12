import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentState } from '@/components/content-state';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import type { FeedFilters, SavedFeedView } from '@/lib/api/types';

type SavedViewsModalProps = {
  visible: boolean;
  views: SavedFeedView[];
  loading: boolean;
  error?: string;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (view: SavedFeedView) => void;
};

function describeFilters(filters: FeedFilters): string {
  const labels: string[] = [];
  if (filters.search) labels.push(`“${filters.search}”`)
  if (filters.entityIds?.length) labels.push(`${filters.entityIds.length} ${filters.entityIds.length === 1 ? 'entity' : 'entities'}`)
  if (filters.party) labels.push(filters.party)
  if (filters.state) labels.push(filters.state)
  if (filters.entityType) labels.push(filters.entityType.replaceAll('_', ' '))
  if (filters.messageFilters?.length) labels.push(filters.messageFilters.map((item) => item.replaceAll('_', ' ')).join(' + '))
  if (filters.donationPlatform) labels.push(filters.donationPlatform)
  if (filters.subscriptionsOnly) labels.push('following only')
  if (filters.fromDate || filters.toDate) labels.push('date range')
  return labels.length ? labels.join(' · ') : 'All messages'
}

export function SavedViewsModal({ visible, views, loading, error, onClose, onRetry, onSelect }: SavedViewsModalProps) {
  const theme = useAppTheme();

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

        {loading ? (
          <ContentState mode="loading" message="Loading saved views…" />
        ) : error ? (
          <ContentState mode="error" title="Couldn’t load saved views" message={error} actionLabel="Try again" onAction={onRetry} />
        ) : views.length === 0 ? (
          <ContentState
            mode="empty"
            title="No saved views yet"
            message="Create a saved view from the CI feed on the website, then it will appear here for everyone in your organization."
          />
        ) : (
          <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
            <Text style={[styles.helper, { color: theme.textMuted }]}>Choose a view to apply its saved search and filters.</Text>
            {views.map((view) => (
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
            ))}
          </ScrollView>
        )}
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
  helper: { fontSize: 13, lineHeight: 19 },
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
  summary: { fontSize: 12, lineHeight: 17, marginTop: 3, textTransform: 'capitalize' },
});
