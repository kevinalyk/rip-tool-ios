import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ContentState } from '@/components/content-state';
import { DirectoryFilterModal } from '@/components/directory-filter-modal';
import { EntityAvatar } from '@/components/entity-avatar';
import { EntityMetadataPills } from '@/components/entity-metadata-pills';
import { OfflineBanner } from '@/components/offline-banner';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { DirectoryEntity, DirectoryFilters } from '@/lib/api/types';
import { canFollowNewEntities, getMobileEntitlements } from '@/lib/entitlements';
import { useAuth } from '@/providers/auth-provider';

export default function DirectoryScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchDraft, setSearchDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filters, setFilters] = useState<DirectoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const canAddFollows = canFollowNewEntities(getMobileEntitlements(user));
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: submittedSearch || undefined }),
    [filters, submittedSearch],
  );
  const activeFilterCount = [filters.party, filters.state, filters.entityType].filter(Boolean).length;

  const options = useQuery({ queryKey: ['directory-options'], queryFn: mobileApi.directoryOptions });
  const directory = useInfiniteQuery({
    queryKey: ['directory', effectiveFilters],
    queryFn: ({ pageParam }) => mobileApi.directory(effectiveFilters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined),
  });
  const entities = useMemo(() => directory.data?.pages.flatMap((page) => page.data) ?? [], [directory.data?.pages]);
  const totalCount = directory.data?.pages[0]?.pagination.totalCount ?? 0;

  const toggleFollow = useMutation({
    mutationFn: async (entity: DirectoryEntity) => {
      if (entity.isFollowing) return mobileApi.unfollowEntity(entity.id);
      return mobileApi.followEntity(entity.id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['directory'] }),
        queryClient.invalidateQueries({ queryKey: ['followed-entities'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    },
    onError: (error) => Alert.alert('Couldn’t update following', error instanceof Error ? error.message : 'Please try again.'),
  });

  const handleFollow = useCallback(
    (entity: DirectoryEntity) => {
      if (!entity.isFollowing && !canAddFollows) {
        Alert.alert('Following requires a paid plan', 'Upgrade on the web to follow entities and prioritize their messages.');
        return;
      }
      toggleFollow.mutate(entity);
    },
    [canAddFollows, toggleFollow],
  );

  const openEntity = useCallback((entity: DirectoryEntity) => {
    router.push({ pathname: '/directory/[id]', params: { id: entity.id } });
  }, []);

  const renderEntity = useCallback(
    ({ item }: ListRenderItemInfo<DirectoryEntity>) => (
      <DirectoryCard
        entity={item}
        followPending={toggleFollow.isPending && toggleFollow.variables?.id === item.id}
        onFollow={handleFollow}
        onPress={openEntity}
      />
    ),
    [handleFollow, openEntity, toggleFollow.isPending, toggleFollow.variables?.id],
  );

  if (directory.isLoading) {
    return <View style={[styles.flex, { backgroundColor: theme.background }]}><OfflineBanner /><ContentState mode="loading" message="Loading the Directory…" /></View>;
  }
  if (directory.isError && !directory.data) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState mode="error" title="Couldn’t load the Directory" message={directory.error instanceof Error ? directory.error.message : undefined} actionLabel="Try again" onAction={() => void directory.refetch()} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.listContent, entities.length === 0 && styles.emptyList]}
        data={entities}
        initialNumToRender={10}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(entity) => entity.id}
        onEndReached={() => {
          if (directory.hasNextPage && !directory.isFetchingNextPage) void directory.fetchNextPage();
        }}
        onEndReachedThreshold={0.45}
        refreshControl={<RefreshControl refreshing={directory.isRefetching && !directory.isFetchingNextPage} onRefresh={() => void directory.refetch()} tintColor={theme.red} />}
        renderItem={renderEntity}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: theme.red }]}>POLITICAL DIRECTORY</Text>
            <Text style={[styles.title, { color: theme.text }]}>Find an entity</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Browse candidates, committees, PACs, nonprofits, state parties, and other organizations tracked by Inbox.GOP.</Text>

            <View style={styles.searchRow}>
              <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.textMuted} />
                <TextInput
                  accessibilityLabel="Search directory"
                  autoCorrect={false}
                  onChangeText={setSearchDraft}
                  onSubmitEditing={() => setSubmittedSearch(searchDraft.trim())}
                  placeholder="Search entities"
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="search"
                  style={[styles.searchInput, { color: theme.text }]}
                  value={searchDraft}
                />
                {searchDraft || submittedSearch ? (
                  <Pressable accessibilityLabel="Clear directory search" hitSlop={8} onPress={() => { setSearchDraft(''); setSubmittedSearch(''); }}>
                    <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Directory filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
                onPress={() => setShowFilters(true)}
                style={({ pressed }) => [
                  styles.filterButton,
                  { backgroundColor: activeFilterCount ? theme.navy : theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
                ]}>
                <Ionicons name="options-outline" size={22} color={activeFilterCount ? '#FFFFFF' : theme.text} />
                {activeFilterCount ? <Text style={styles.filterCount}>{activeFilterCount}</Text> : null}
              </Pressable>
            </View>

            <View style={styles.resultRow}>
              <Text style={[styles.resultCount, { color: theme.textMuted }]}>{totalCount.toLocaleString()} {totalCount === 1 ? 'entity' : 'entities'}</Text>
              {activeFilterCount || submittedSearch ? (
                <Pressable accessibilityRole="button" onPress={() => { setSearchDraft(''); setSubmittedSearch(''); setFilters({}); }}>
                  <Text style={[styles.clearFilters, { color: theme.red }]}>Clear all</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={<ContentState mode="empty" title="No entities match" message="Try another name or clear one of your Directory filters." actionLabel="Clear filters" onAction={() => { setSearchDraft(''); setSubmittedSearch(''); setFilters({}); }} />}
        ListFooterComponent={directory.isFetchingNextPage ? <ActivityIndicator color={theme.red} style={styles.footerSpinner} /> : <View style={styles.footerSpace} />}
      />

      {showFilters ? (
        <DirectoryFilterModal
          visible
          filters={effectiveFilters}
          options={options.data}
          onClose={() => setShowFilters(false)}
          onApply={(nextFilters) => setFilters({ ...nextFilters, search: undefined })}
        />
      ) : null}
    </View>
  );
}

const DirectoryCard = memo(function DirectoryCard({
  entity,
  followPending,
  onFollow,
  onPress,
}: {
  entity: DirectoryEntity;
  followPending: boolean;
  onFollow: (entity: DirectoryEntity) => void;
  onPress: (entity: DirectoryEntity) => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${entity.name}`}
      onPress={() => onPress(entity)}
      style={({ pressed }) => [styles.card, shadows.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}>
      <View style={styles.cardTop}>
        <EntityAvatar name={entity.name} imageUrl={entity.imageUrl} size={56} />
        <View style={styles.cardIdentity}>
          <Text numberOfLines={2} style={[styles.entityName, { color: theme.text }]}>{entity.name}</Text>
          {entity.office ? <Text numberOfLines={1} style={[styles.office, { color: theme.textMuted }]}>{entity.office}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={entity.isFollowing ? `Unfollow ${entity.name}` : `Follow ${entity.name}`}
          disabled={followPending}
          hitSlop={6}
          onPress={(event) => { event.stopPropagation(); onFollow(entity); }}
          style={({ pressed }) => [styles.followButton, { opacity: pressed || followPending ? 0.45 : 1 }]}>
          <Ionicons name={followPending ? 'ellipsis-horizontal' : entity.isFollowing ? 'star' : 'star-outline'} size={23} color={entity.isFollowing ? theme.red : theme.textMuted} />
        </Pressable>
      </View>
      <EntityMetadataPills party={entity.party} state={entity.state} type={entity.type} />
      {entity.description ? <Text numberOfLines={2} style={[styles.description, { color: theme.textMuted }]}>{entity.description}</Text> : null}
      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <View style={styles.stat}><Ionicons name="mail-outline" size={15} color={theme.textMuted} /><Text style={[styles.statText, { color: theme.textMuted }]}>{entity.counts.emails.toLocaleString()}</Text></View>
        <View style={styles.stat}><Ionicons name="chatbubble-outline" size={14} color={theme.textMuted} /><Text style={[styles.statText, { color: theme.textMuted }]}>{entity.counts.sms.toLocaleString()}</Text></View>
        <Text style={[styles.totalText, { color: theme.textMuted }]}>{entity.counts.total.toLocaleString()} total</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1 },
  header: { paddingBottom: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: spacing.xs },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: spacing.sm, maxWidth: 350 },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  searchBox: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, fontSize: 16, minHeight: 48 },
  filterButton: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, justifyContent: 'center', width: 50 },
  filterCount: { backgroundColor: '#FFFFFF', borderRadius: 8, color: '#10232E', fontSize: 9, fontWeight: '800', minWidth: 16, overflow: 'hidden', paddingHorizontal: 4, position: 'absolute', right: 4, textAlign: 'center', top: 4 },
  resultRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, minHeight: 28 },
  resultCount: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  clearFilters: { fontSize: 13, fontWeight: '700' },
  card: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, marginHorizontal: spacing.lg, marginVertical: spacing.sm, padding: spacing.lg },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  cardIdentity: { flex: 1 },
  entityName: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  office: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  followButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  description: { fontSize: 13, lineHeight: 19 },
  cardFooter: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md },
  stat: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  statText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  totalText: { flex: 1, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  footerSpinner: { padding: spacing.xl },
  footerSpace: { height: spacing.lg },
});
