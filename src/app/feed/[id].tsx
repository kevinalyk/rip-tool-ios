import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ContentState } from '@/components/content-state';
import EmailPreview from '@/components/email-preview';
import { EntityAvatar } from '@/components/entity-avatar';
import { PrimaryButton } from '@/components/primary-button';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { MessageType } from '@/lib/api/types';
import { getMobileEntitlements } from '@/lib/entitlements';
import { extractCtaLinks, formatDate, stripHtml, titleCase } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

type DetailSection = 'preview' | 'links';

export default function FeedDetailScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const entitlements = getMobileEntitlements(user);
  const params = useLocalSearchParams<{ id: string; type?: string }>();
  const [section, setSection] = useState<DetailSection>('preview');
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
  const followedCount = followed.data?.data.length ?? 0;
  const followLimitReached =
    !isFollowing &&
    entitlements.followedEntityLimit !== null &&
    followedCount >= entitlements.followedEntityLimit;

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

  const shareMessage = useMutation({
    mutationFn: () => mobileApi.shareFeedItem(id, type),
    onSuccess: async ({ shareUrl }) => {
      const shareEntityName = item?.entity?.name || item?.senderName || 'Inbox.GOP';
      const shareSubject = item?.subject || (type === 'sms' ? 'Text message' : 'Email');
      await Share.share(
        {
          message: `${shareSubject}\n\n${shareEntityName}\n${shareUrl}`,
          url: shareUrl,
        },
        { subject: shareSubject },
      );
    },
    onError: (error) => Alert.alert('Couldn’t share this message', error instanceof Error ? error.message : 'Please try again.'),
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
  const entityName = item.entity?.name || item.senderName || 'Unknown sender';
  const entityMeta = item.entity
    ? [titleCase(item.entity.party), item.entity.state, titleCase(item.entity.type)].filter(Boolean).join(' · ')
    : '';

  return (
    <>
      <Stack.Screen
        options={{
          title: type === 'sms' ? 'Text message' : 'Email preview',
          headerRight: () => (
            <Pressable
              accessibilityLabel="Share message"
              accessibilityRole="button"
              disabled={shareMessage.isPending}
              hitSlop={8}
              onPress={() => shareMessage.mutate()}
              style={({ pressed }) => [styles.headerAction, { opacity: pressed || shareMessage.isPending ? 0.45 : 1 }]}>
              <Ionicons name={shareMessage.isPending ? 'ellipsis-horizontal' : 'share-outline'} size={23} color={theme.red} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.senderRow}>
            <EntityAvatar name={entityName} imageUrl={item.entity?.imageUrl} size={58} />
            <View style={styles.senderInfo}>
              <Text selectable style={[styles.sender, { color: theme.text }]}>{entityName}</Text>
              {entityMeta ? <Text style={[styles.entityMetaText, { color: theme.textMuted }]}>{entityMeta}</Text> : null}
            </View>
            <View style={[styles.typeBadge, { backgroundColor: type === 'sms' ? `${theme.blue}20` : `${theme.red}16` }]}>
              <Ionicons name={type === 'sms' ? 'chatbubble-outline' : 'mail-outline'} size={17} color={type === 'sms' ? theme.blue : theme.red} />
              <Text style={[styles.typeText, { color: type === 'sms' ? theme.blue : theme.red }]}>{type === 'sms' ? 'SMS' : 'EMAIL'}</Text>
            </View>
          </View>

          <Text selectable style={[styles.subject, { color: theme.text }]}>{item.subject || 'No subject'}</Text>

          <View style={styles.messageMeta}>
            <View style={styles.metaLine}>
              <Ionicons name={type === 'sms' ? 'call-outline' : 'mail-outline'} size={16} color={theme.textMuted} />
              <Text selectable numberOfLines={1} style={[styles.senderAddress, { color: theme.textMuted }]}>{item.senderEmail}</Text>
            </View>
            <View style={styles.metaLine}>
              <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.senderAddress, { color: theme.textMuted }]}>{formatDate(item.dateReceived)}</Text>
            </View>
          </View>

          {item.entity ? (
            <View style={[styles.followRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.followHint, { color: theme.textMuted }]}>
                {followLimitReached
                  ? 'Your organization has reached its plan’s follow limit.'
                  : `Keep ${entityName} prioritized in your feed.`}
              </Text>
              <PrimaryButton
                label={isFollowing ? 'Following' : followLimitReached ? 'Limit reached' : 'Follow'}
                variant={isFollowing ? 'secondary' : 'primary'}
                loading={toggleFollow.isPending}
                disabled={followLimitReached}
                onPress={() => toggleFollow.mutate()}
                style={styles.followButton}
              />
            </View>
          ) : null}
        </View>

        <View style={[styles.segmentedControl, { backgroundColor: theme.surfaceMuted }]}>
          <SegmentButton label={type === 'sms' ? 'Message' : 'Email preview'} selected={section === 'preview'} onPress={() => setSection('preview')} />
          <SegmentButton label={`Links (${links.length})`} selected={section === 'links'} onPress={() => setSection('links')} />
        </View>

        {section === 'preview' ? (
          type === 'email' && item.emailContent ? (
            <View style={[styles.emailCard, shadows.card, { borderColor: theme.border }]}>
              <EmailPreview
                html={item.emailContent}
                dom={{
                  automaticallyAdjustContentInsets: false,
                  bounces: false,
                  contentInsetAdjustmentBehavior: 'never',
                  matchContents: true,
                  scrollEnabled: false,
                  showsHorizontalScrollIndicator: false,
                  showsVerticalScrollIndicator: false,
                  style: { minHeight: 560, width: '100%' },
                }}
              />
            </View>
          ) : (
            <View style={[styles.bodyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {type === 'sms' ? (
                <View style={[styles.smsBubble, { backgroundColor: `${theme.blue}16` }]}>
                  <Text selectable style={[styles.body, { color: theme.text }]}>{body}</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MESSAGE</Text>
                  <Text selectable style={[styles.body, { color: theme.text }]}>{body}</Text>
                </>
              )}
            </View>
          )
        ) : (
          <View style={[styles.bodyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {links.length ? (
              links.map((link, index) => (
                <Pressable
                  key={`${link.url}:${index}`}
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(link.url)}
                  style={({ pressed }) => [
                    styles.linkRow,
                    index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                    { opacity: pressed ? 0.62 : 1 },
                  ]}>
                  <View style={[styles.linkIcon, { backgroundColor: `${theme.red}12` }]}>
                    <Ionicons name="open-outline" size={19} color={theme.red} />
                  </View>
                  <View style={styles.linkCopy}>
                    <Text style={[styles.linkText, { color: theme.text }]} numberOfLines={2}>{link.label || link.text || 'Open link'}</Text>
                    <Text style={[styles.linkUrl, { color: theme.textMuted }]} numberOfLines={1}>{link.url}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyLinks}>
                <Ionicons name="link-outline" size={28} color={theme.textMuted} />
                <Text style={[styles.emptyLinksTitle, { color: theme.text }]}>No links detected</Text>
                <Text style={[styles.emptyLinksText, { color: theme.textMuted }]}>This message doesn’t contain any available CTA links.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        selected && { backgroundColor: theme.surface },
        { opacity: pressed ? 0.68 : 1 },
      ]}>
      <Text style={[styles.segmentLabel, { color: selected ? theme.text : theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxxl },
  headerAction: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  heroCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  senderRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  senderInfo: { flex: 1 },
  sender: { fontSize: 17, fontWeight: '800' },
  entityMetaText: { fontSize: 12, marginTop: 3 },
  typeBadge: { alignItems: 'center', borderRadius: radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  subject: { fontSize: 24, fontWeight: '800', letterSpacing: -0.45, lineHeight: 30, marginTop: spacing.xl },
  messageMeta: { gap: spacing.sm, marginTop: spacing.lg },
  metaLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  senderAddress: { flex: 1, fontSize: 13 },
  followRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  followHint: { flex: 1, fontSize: 12, lineHeight: 17 },
  followButton: { minHeight: 44, minWidth: 108, paddingHorizontal: spacing.lg },
  segmentedControl: { borderRadius: radii.md, flexDirection: 'row', padding: 4 },
  segmentButton: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.sm, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  segmentLabel: { fontSize: 13, fontWeight: '700' },
  emailCard: { backgroundColor: '#FFFFFF', borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, minHeight: 560, overflow: 'hidden' },
  bodyCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: spacing.md },
  smsBubble: { borderRadius: 18, borderBottomLeftRadius: 5, padding: spacing.lg },
  body: { fontSize: 16, lineHeight: 25 },
  linkRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 68, paddingVertical: spacing.sm },
  linkIcon: { alignItems: 'center', borderRadius: 18, height: 38, justifyContent: 'center', width: 38 },
  linkCopy: { flex: 1 },
  linkText: { fontSize: 15, fontWeight: '700' },
  linkUrl: { fontSize: 11, marginTop: 3 },
  emptyLinks: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xxxl },
  emptyLinksTitle: { fontSize: 16, fontWeight: '700' },
  emptyLinksText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
