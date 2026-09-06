import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { EntityAvatar } from '@/components/entity-avatar';
import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { MessageType } from '@/lib/api/types';
import { extractCtaLinks, formatDate, stripHtml, titleCase } from '@/lib/format';

export default function FeedDetailScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; type?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const type: MessageType = params.type === 'sms' ? 'sms' : 'email';

  const detail = useQuery({
    queryKey: ['feed-item', type, id],
    queryFn: () => mobileApi.feedItem(id, type),
    enabled: Boolean(id),
  });
  const followed = useQuery({ queryKey: ['followed-entities'], queryFn: mobileApi.followedEntities });
  const item = detail.data?.data;
  const isFollowing = Boolean(item?.entityId && followed.data?.data.some((entity) => entity.id === item.entityId));

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!item?.entityId) return;
      if (isFollowing) await mobileApi.unfollowEntity(item.entityId);
      else await mobileApi.followEntity(item.entityId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['followed-entities'] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => Alert.alert('Couldn’t update following', error instanceof Error ? error.message : 'Please try again.'),
  });

  if (detail.isLoading) return <ContentState mode="loading" message="Loading message…" />;
  if (detail.isError || !item) {
    return (
      <ContentState
        mode="error"
        title="Message unavailable"
        message={detail.error instanceof Error ? detail.error.message : 'This message may no longer be available.'}
        actionLabel="Try again"
        onAction={() => void detail.refetch()}
      />
    );
  }

  const body = stripHtml(item.emailContent || item.emailPreview) || 'No message body is available.';
  const links = extractCtaLinks(item.ctaLinks);
  const entityName = item.entity?.name || item.senderName;

  return (
    <>
      <Stack.Screen options={{ title: type === 'sms' ? 'Text message' : 'Email' }} />
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.senderRow}>
            <EntityAvatar name={entityName} imageUrl={item.entity?.imageUrl} size={52} />
            <View style={styles.senderInfo}>
              <Text style={[styles.sender, { color: theme.text }]}>{entityName}</Text>
              <Text style={[styles.senderAddress, { color: theme.textMuted }]} numberOfLines={1}>{item.senderEmail}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: type === 'sms' ? `${theme.blue}20` : `${theme.red}16` }]}>
              <Ionicons name={type === 'sms' ? 'chatbubble-outline' : 'mail-outline'} size={18} color={type === 'sms' ? theme.blue : theme.red} />
            </View>
          </View>

          <Text style={[styles.subject, { color: theme.text }]}>{item.subject || 'No subject'}</Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(item.dateReceived)}</Text>

          {item.entity ? (
            <View style={[styles.entityMeta, { borderTopColor: theme.border }]}>
              <Text style={[styles.entityMetaText, { color: theme.textMuted }]}>
                {[titleCase(item.entity.party), item.entity.state, titleCase(item.entity.type)].filter(Boolean).join(' · ')}
              </Text>
              <PrimaryButton
                label={isFollowing ? 'Following' : 'Follow'}
                variant={isFollowing ? 'secondary' : 'primary'}
                loading={toggleFollow.isPending}
                onPress={() => toggleFollow.mutate()}
                style={styles.followButton}
              />
            </View>
          ) : null}
        </View>

        {type === 'email' ? (
          <View style={[styles.metricCard, { backgroundColor: theme.navy }]}>
            <View>
              <Text style={styles.metricLabel}>INBOX PLACEMENT</Text>
              <Text style={styles.metricValue}>{Math.round(item.inboxRate)}%</Text>
            </View>
            <Ionicons name="analytics-outline" size={30} color="rgba(255,255,255,0.8)" />
          </View>
        ) : null}

        <View style={[styles.bodyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MESSAGE</Text>
          <Text selectable style={[styles.body, { color: theme.text }]}>{body}</Text>
        </View>

        {links.length ? (
          <View style={[styles.bodyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>LINKS</Text>
            {links.map((link, index) => (
              <Pressable
                key={`${link.url}:${index}`}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(link.url)}
                style={({ pressed }) => [styles.linkRow, { borderTopColor: theme.border, opacity: pressed ? 0.62 : 1 }]}>
                <Ionicons name="open-outline" size={20} color={theme.red} />
                <Text style={[styles.linkText, { color: theme.text }]} numberOfLines={2}>{link.label || link.text || 'Open link'}</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxxl },
  heroCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  senderRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  senderInfo: { flex: 1 },
  sender: { fontSize: 16, fontWeight: '700' },
  senderAddress: { fontSize: 12, marginTop: 3 },
  typeBadge: { alignItems: 'center', borderRadius: radii.md, height: 42, justifyContent: 'center', width: 42 },
  subject: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5, lineHeight: 31, marginTop: spacing.xl },
  date: { fontSize: 13, marginTop: spacing.sm },
  entityMeta: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  entityMetaText: { flex: 1, fontSize: 13 },
  followButton: { minHeight: 44, minWidth: 108, paddingHorizontal: spacing.lg },
  metricCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  metricLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  metricValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 2 },
  bodyCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: spacing.md },
  body: { fontSize: 16, lineHeight: 25 },
  linkRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
