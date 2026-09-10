import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ContentState } from '@/components/content-state';
import { OfflineBanner } from '@/components/offline-banner';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { AnnouncementSummary } from '@/lib/api/types';

function formatPublishedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export default function WhatsNewScreen() {
  const theme = useAppTheme();
  const announcements = useInfiniteQuery({
    queryKey: ['announcements'],
    queryFn: ({ pageParam }) => mobileApi.announcements(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined),
  });
  const items = useMemo(
    () => announcements.data?.pages.flatMap((page) => page.data) ?? [],
    [announcements.data?.pages],
  );

  const openAnnouncement = useCallback((announcement: AnnouncementSummary) => {
    router.push({ pathname: '/news/[slug]', params: { slug: announcement.slug } });
  }, []);

  const renderAnnouncement = useCallback(
    ({ item }: ListRenderItemInfo<AnnouncementSummary>) => (
      <AnnouncementCard announcement={item} onPress={openAnnouncement} />
    ),
    [openAnnouncement],
  );

  if (announcements.isLoading) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState mode="loading" message="Loading updates…" />
      </View>
    );
  }

  if (announcements.isError && !announcements.data) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState
          mode="error"
          title="Couldn’t load updates"
          message={announcements.error instanceof Error ? announcements.error.message : undefined}
          actionLabel="Try again"
          onAction={() => void announcements.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
        data={items}
        initialNumToRender={8}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (announcements.hasNextPage && !announcements.isFetchingNextPage) {
            void announcements.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl
            refreshing={announcements.isRefetching && !announcements.isFetchingNextPage}
            onRefresh={() => void announcements.refetch()}
            tintColor={theme.red}
          />
        }
        renderItem={renderAnnouncement}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: `${theme.red}14` }]}>
              <Ionicons name="megaphone-outline" size={24} color={theme.red} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>What&apos;s New</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Updates, improvements, and new features from the Inbox.GOP team.</Text>
          </View>
        }
        ListEmptyComponent={
          <ContentState mode="empty" title="No updates yet" message="New Inbox.GOP product announcements will appear here." />
        }
        ListFooterComponent={
          announcements.isFetchingNextPage
            ? <ActivityIndicator color={theme.red} style={styles.footerSpinner} />
            : <View style={styles.footerSpace} />
        }
      />
    </View>
  );
}

const AnnouncementCard = memo(function AnnouncementCard({
  announcement,
  onPress,
}: {
  announcement: AnnouncementSummary;
  onPress: (announcement: AnnouncementSummary) => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read ${announcement.title}`}
      onPress={() => onPress(announcement)}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
      ]}>
      {announcement.imageUrl ? (
        <View style={[styles.imageFrame, { backgroundColor: theme.surfaceMuted }]}>
          <Image
            accessibilityLabel=""
            cachePolicy="memory-disk"
            contentFit="contain"
            source={{ uri: announcement.imageUrl }}
            style={styles.image}
            transition={180}
          />
        </View>
      ) : null}
      <View style={styles.cardBody}>
        <Text style={[styles.date, { color: theme.red }]}>{formatPublishedDate(announcement.publishedAt).toUpperCase()}</Text>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{announcement.title}</Text>
        {announcement.excerpt ? (
          <Text numberOfLines={3} style={[styles.excerpt, { color: theme.textMuted }]}>{announcement.excerpt}</Text>
        ) : null}
        <View style={styles.readRow}>
          <Text style={[styles.readText, { color: theme.red }]}>Continue reading</Text>
          <Ionicons name="arrow-forward" size={17} color={theme.red} />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxxl },
  emptyList: { flexGrow: 1 },
  header: { alignItems: 'flex-start', paddingBottom: spacing.sm },
  headerIcon: { alignItems: 'center', borderRadius: radii.md, height: 46, justifyContent: 'center', marginBottom: spacing.md, width: 46 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: spacing.sm, maxWidth: 350 },
  card: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  imageFrame: { aspectRatio: 16 / 9, width: '100%' },
  image: { height: '100%', width: '100%' },
  cardBody: { gap: spacing.sm, padding: spacing.lg },
  date: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  cardTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.25, lineHeight: 25 },
  excerpt: { fontSize: 14, lineHeight: 21 },
  readRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 44 },
  readText: { fontSize: 14, fontWeight: '800' },
  footerSpinner: { padding: spacing.xl },
  footerSpace: { height: spacing.lg },
});
