import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import NewsArticle from '@/components/news-article';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';

const WEB_NEWS_URL = 'https://app.rip-tool.com/news';

function formatPublishedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export default function WhatsNewDetailScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const detail = useQuery({
    queryKey: ['announcement', slug],
    queryFn: () => mobileApi.announcement(slug),
    enabled: Boolean(slug),
  });
  const announcement = detail.data?.data;

  if (detail.isLoading) return <ContentState mode="loading" message="Loading update…" />;
  if (detail.isError || !announcement) {
    return (
      <ContentState
        mode="error"
        title="Update unavailable"
        message={detail.error instanceof Error ? detail.error.message : 'This update could not be found.'}
        actionLabel="Try again"
        onAction={() => void detail.refetch()}
      />
    );
  }

  const shareUrl = `${WEB_NEWS_URL}/${encodeURIComponent(announcement.slug)}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: "What's New",
          headerRight: () => (
            <Pressable
              accessibilityLabel="Share update"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void Share.share({ message: `${announcement.title}\n\n${shareUrl}`, url: shareUrl }, { subject: announcement.title })}
              style={({ pressed }) => [styles.headerAction, { opacity: pressed ? 0.45 : 1 }]}>
              <Ionicons name="share-outline" size={23} color={theme.red} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}>
        <View style={[styles.articleCard, shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
          <View style={styles.heading}>
            <Text style={[styles.date, { color: theme.red }]}>{formatPublishedDate(announcement.publishedAt).toUpperCase()}</Text>
            <Text selectable style={[styles.title, { color: theme.text }]}>{announcement.title}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <NewsArticle
            html={announcement.body}
            backgroundColor={theme.surface}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            accentColor={theme.red}
            openLink={async (url) => Linking.openURL(url)}
            dom={{
              automaticallyAdjustContentInsets: false,
              bounces: false,
              contentInsetAdjustmentBehavior: 'never',
              matchContents: true,
              scrollEnabled: false,
              showsHorizontalScrollIndicator: false,
              showsVerticalScrollIndicator: false,
              style: { minHeight: 180, width: '100%' },
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  articleCard: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  imageFrame: { aspectRatio: 16 / 9, width: '100%' },
  image: { height: '100%', width: '100%' },
  heading: { gap: spacing.sm, padding: spacing.xl },
  date: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.55, lineHeight: 33 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.xl },
  headerAction: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
});
