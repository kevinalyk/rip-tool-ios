import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActiveFilterBar } from '@/components/active-filter-bar';
import { ContentState } from '@/components/content-state';
import { FeedCard } from '@/components/feed-card';
import { FilterModal } from '@/components/filter-modal';
import { OfflineBanner } from '@/components/offline-banner';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { FeedFilters, FeedItem } from '@/lib/api/types';
import { getMobileEntitlements, sanitizeFeedFiltersForEntitlements } from '@/lib/entitlements';
import { useAuth } from '@/providers/auth-provider';

export default function FeedScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const [searchDraft, setSearchDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filters, setFilters] = useState<FeedFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const entitlements = useMemo(() => getMobileEntitlements(user), [user]);
  const canSearchAndFilter = entitlements.canSearchAndFilterFeed;

  useEffect(() => {
    if (canSearchAndFilter) return;

    queryClient.removeQueries({ queryKey: ['feed-filters'] });

    const clearLockedFilters = setTimeout(() => {
      setSearchDraft('');
      setSubmittedSearch('');
      setFilters({});
      setShowFilters(false);
    }, 0);

    return () => clearTimeout(clearLockedFilters);
  }, [canSearchAndFilter, queryClient]);

  const effectiveFilters = useMemo(
    () =>
      sanitizeFeedFiltersForEntitlements(
        { ...filters, search: submittedSearch || undefined },
        entitlements,
      ),
    [entitlements, filters, submittedSearch],
  );
  const activeFilterCount = [
    filters.entityIds?.length,
    filters.party,
    filters.state,
    filters.entityType,
    filters.messageFilters?.length,
    filters.donationPlatform,
    filters.fromDate || filters.toDate,
    filters.subscriptionsOnly,
  ].filter(Boolean).length;

  const filterOptions = useQuery({
    queryKey: ['feed-filters'],
    queryFn: mobileApi.feedFilters,
    enabled: canSearchAndFilter,
  });
  const feed = useInfiniteQuery({
    queryKey: ['feed', effectiveFilters],
    queryFn: ({ pageParam }) => mobileApi.feed(effectiveFilters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined),
  });

  const pages = feed.data?.pages;
  const items = useMemo(() => pages?.flatMap((page) => page.data) ?? [], [pages]);
  const refreshing = feed.isRefetching && !feed.isFetchingNextPage;

  const openItem = useCallback((item: FeedItem) => {
    router.push({ pathname: '/feed/[id]', params: { id: item.id, type: item.type } });
  }, []);

  const renderFeedItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedItem>) => <FeedCard item={item} onPress={openItem} />,
    [openItem],
  );

  if (feed.isLoading) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState mode="loading" message="Loading your intelligence feed…" />
      </View>
    );
  }

  if (feed.isError && !feed.data) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState
          mode="error"
          title="Couldn’t load the feed"
          message={feed.error instanceof Error ? feed.error.message : undefined}
          actionLabel="Try again"
          onAction={() => void feed.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        initialNumToRender={8}
        keyExtractor={(item) => `${item.type}:${item.id}`}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={8}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void Promise.allSettled([feed.refetch(), refreshProfile()])}
            tintColor={theme.red}
          />
        }
        renderItem={renderFeedItem}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        contentContainerStyle={[styles.listContent, items.length === 0 && styles.emptyList]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: theme.red }]}>COMPETITIVE INTELLIGENCE</Text>
            <Text style={[styles.title, { color: theme.text }]}>Latest messages</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Track the political email and SMS activity that matters now.</Text>

            {canSearchAndFilter ? (
              <>
                <View style={styles.searchRow}>
                  <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                      accessibilityLabel="Search feed"
                      autoCorrect={false}
                      onChangeText={setSearchDraft}
                      onSubmitEditing={() => setSubmittedSearch(searchDraft.trim())}
                      placeholder="Search sender or subject"
                      placeholderTextColor={theme.textMuted}
                      returnKeyType="search"
                      style={[styles.searchInput, { color: theme.text }]}
                      value={searchDraft}
                    />
                    {searchDraft || submittedSearch ? (
                      <Pressable
                        accessibilityLabel="Clear search"
                        hitSlop={8}
                        onPress={() => {
                          setSearchDraft('');
                          setSubmittedSearch('');
                        }}>
                        <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                      </Pressable>
                    ) : null}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
                    onPress={() => setShowFilters(true)}
                    style={({ pressed }) => [
                      styles.filterButton,
                      { backgroundColor: activeFilterCount ? theme.navy : theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
                    ]}>
                    <Ionicons name="options-outline" size={22} color={activeFilterCount ? '#FFFFFF' : theme.text} />
                    {activeFilterCount ? <Text style={styles.filterCount}>{activeFilterCount}</Text> : null}
                  </Pressable>
                </View>

                <ActiveFilterBar filters={filters} options={filterOptions.data} onChange={setFilters} />
              </>
            ) : (
              <View style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.accessIcon, { backgroundColor: `${theme.red}12` }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.red} />
                </View>
                <View style={styles.accessCopy}>
                  <Text style={[styles.accessTitle, { color: theme.text }]}>Starter feed access</Text>
                  <Text style={[styles.accessText, { color: theme.textMuted }]}>
                    Your plan includes the latest {entitlements.feedHistoryHours ?? 3} hours. Search and filters are available on paid plans.
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <ContentState
            mode="empty"
            title={canSearchAndFilter ? 'No messages match' : 'No recent messages'}
            message={
              canSearchAndFilter
                ? 'Try clearing your search or changing the active filters.'
                : `No messages were captured in your current ${entitlements.feedHistoryHours ?? 3}-hour window.`
            }
            actionLabel={canSearchAndFilter && (activeFilterCount || searchDraft || submittedSearch) ? 'Clear filters' : undefined}
            onAction={canSearchAndFilter && (activeFilterCount || searchDraft || submittedSearch)
              ? () => {
                  setSearchDraft('');
                  setSubmittedSearch('');
                  setFilters({});
                }
              : undefined}
          />
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <ActivityIndicator color={theme.red} style={styles.footerSpinner} /> : <View style={styles.footerSpace} />
        }
      />

      {canSearchAndFilter && showFilters ? (
        <FilterModal
          visible
          filters={effectiveFilters}
          options={filterOptions.data}
          onClose={() => setShowFilters(false)}
          onApply={(nextFilters) => setFilters({ ...nextFilters, search: undefined })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1 },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  searchBox: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 48,
  },
  accessCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  accessIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  accessCopy: { flex: 1 },
  accessTitle: { fontSize: 14, fontWeight: '800' },
  accessText: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  filterButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    width: 50,
  },
  filterCount: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    color: '#10232E',
    fontSize: 9,
    fontWeight: '800',
    minWidth: 16,
    overflow: 'hidden',
    paddingHorizontal: 4,
    position: 'absolute',
    right: 4,
    textAlign: 'center',
    top: 4,
  },
  footerSpinner: { padding: spacing.xl },
  footerSpace: { height: spacing.lg },
});
