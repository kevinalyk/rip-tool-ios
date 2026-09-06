import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ContentState } from '@/components/content-state';
import { FeedCard } from '@/components/feed-card';
import { FilterModal } from '@/components/filter-modal';
import { OfflineBanner } from '@/components/offline-banner';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { FeedFilters, FeedItem } from '@/lib/api/types';

export default function FeedScreen() {
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<FeedFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [debouncedSearch, filters],
  );
  const activeFilterCount = [
    filters.party,
    filters.state,
    filters.office,
    filters.messageType,
    filters.subscriptionsOnly,
  ].filter(Boolean).length;

  const filterOptions = useQuery({ queryKey: ['feed-filters'], queryFn: mobileApi.feedFilters });
  const feed = useInfiniteQuery({
    queryKey: ['feed', effectiveFilters],
    queryFn: ({ pageParam }) => mobileApi.feed(effectiveFilters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined),
  });

  const items = feed.data?.pages.flatMap((page) => page.data) || [];
  const refreshing = feed.isRefetching && !feed.isFetchingNextPage;

  const openItem = (item: FeedItem) => {
    router.push({ pathname: '/feed/[id]', params: { id: item.id, type: item.type } });
  };

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
        data={items}
        keyExtractor={(item) => `${item.type}:${item.id}`}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        onEndReachedThreshold={0.45}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void feed.refetch()} tintColor={theme.red} />}
        renderItem={({ item }) => <FeedCard item={item} onPress={() => openItem(item)} />}
        contentContainerStyle={[styles.listContent, items.length === 0 && styles.emptyList]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: theme.red }]}>COMPETITIVE INTELLIGENCE</Text>
            <Text style={[styles.title, { color: theme.text }]}>Latest messages</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Track the political email and SMS activity that matters now.</Text>

            <View style={styles.searchRow}>
              <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.textMuted} />
                <TextInput
                  accessibilityLabel="Search feed"
                  autoCorrect={false}
                  onChangeText={setSearch}
                  placeholder="Search sender or subject"
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="search"
                  style={[styles.searchInput, { color: theme.text }]}
                  value={search}
                />
                {search ? (
                  <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')}>
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
          </View>
        }
        ListEmptyComponent={
          <ContentState
            mode="empty"
            title="No messages match"
            message="Try clearing your search or changing the active filters."
            actionLabel={activeFilterCount || search ? 'Clear filters' : undefined}
            onAction={activeFilterCount || search ? () => { setSearch(''); setFilters({}); } : undefined}
          />
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <ActivityIndicator color={theme.red} style={styles.footerSpinner} /> : <View style={styles.footerSpace} />
        }
      />

      {showFilters ? (
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
