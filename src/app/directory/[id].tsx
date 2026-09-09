import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { EntityMetadataPills } from '@/components/entity-metadata-pills';
import { PrimaryButton } from '@/components/primary-button';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { DirectoryRecentMessage } from '@/lib/api/types';
import { canFollowNewEntities, getMobileEntitlements } from '@/lib/entitlements';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

export default function DirectoryEntityScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const canAddFollows = canFollowNewEntities(getMobileEntitlements(user));
  const detail = useQuery({
    queryKey: ['directory-entity', id],
    queryFn: () => mobileApi.directoryEntity(id),
    enabled: Boolean(id),
  });
  const entity = detail.data?.data;
  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!entity) return;
      if (entity.isFollowing) await mobileApi.unfollowEntity(entity.id);
      else await mobileApi.followEntity(entity.id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['directory'] }),
        queryClient.invalidateQueries({ queryKey: ['directory-entity', id] }),
        queryClient.invalidateQueries({ queryKey: ['followed-entities'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    },
    onError: (error) => Alert.alert('Couldn’t update following', error instanceof Error ? error.message : 'Please try again.'),
  });

  if (detail.isLoading) return <ContentState mode="loading" message="Loading profile…" />;
  if (detail.isError || !entity) {
    return <ContentState mode="error" title="Profile unavailable" message={detail.error instanceof Error ? detail.error.message : 'This entity could not be found.'} actionLabel="Try again" onAction={() => void detail.refetch()} />;
  }

  const followUnavailable = !entity.isFollowing && !canAddFollows;

  return (
    <>
      <Stack.Screen options={{ title: entity.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}>
        <View style={[styles.hero, shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.imageFrame, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            {entity.imageUrl ? (
              <Image accessibilityLabel={`${entity.name} profile picture`} cachePolicy="memory-disk" contentFit="contain" source={{ uri: entity.imageUrl }} style={styles.image} transition={180} />
            ) : (
              <Text style={[styles.initials, { color: theme.navy }]}>{entity.name.slice(0, 2).toUpperCase()}</Text>
            )}
          </View>

          <Text selectable style={[styles.name, { color: theme.text }]}>{entity.name}</Text>
          {entity.office ? <Text selectable style={[styles.office, { color: theme.textMuted }]}>{entity.office}</Text> : null}
          <EntityMetadataPills party={entity.party} state={entity.state} type={entity.type} />
          <PrimaryButton
            label={entity.isFollowing ? 'Following' : followUnavailable ? 'Paid plan required' : 'Follow'}
            variant={entity.isFollowing ? 'secondary' : 'primary'}
            loading={toggleFollow.isPending}
            onPress={() => {
              if (followUnavailable) {
                Alert.alert('Following requires a paid plan', 'Upgrade on the web to follow entities and prioritize their messages.');
              } else {
                toggleFollow.mutate();
              }
            }}
            style={styles.follow}
          />
        </View>

        <View style={[styles.stats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Stat icon="mail-outline" label="Emails" value={entity.counts.emails} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <Stat icon="chatbubble-outline" label="SMS" value={entity.counts.sms} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <Stat icon="analytics-outline" label="Total" value={entity.counts.total} />
        </View>

        {entity.bio || entity.description ? (
          <Section title="About">
            <Text selectable style={[styles.body, { color: theme.textMuted }]}>{entity.bio || entity.description}</Text>
            {entity.ballotpediaUrl ? (
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(entity.ballotpediaUrl!)} style={styles.externalLink}>
                <Ionicons name="open-outline" size={17} color={theme.red} />
                <Text style={[styles.externalLinkText, { color: theme.red }]}>View on Ballotpedia</Text>
              </Pressable>
            ) : null}
          </Section>
        ) : null}

        {entity.emailSenders.length || entity.smsSenders.length ? (
          <Section title="Known senders">
            {entity.emailSenders.length ? <SenderGroup icon="mail-outline" label="Email" values={entity.emailSenders} /> : null}
            {entity.smsSenders.length ? <SenderGroup icon="chatbubble-outline" label="SMS" values={entity.smsSenders} /> : null}
          </Section>
        ) : null}

        <Section title="Recent activity">
          {entity.recentMessages.length ? entity.recentMessages.map((message, index) => (
            <RecentMessage key={`${message.type}:${message.id}`} message={message} divider={index > 0} />
          )) : <Text style={[styles.body, { color: theme.textMuted }]}>No messages are available inside your plan’s current history window.</Text>}
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  const theme = useAppTheme();
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={theme.textMuted} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value.toLocaleString()}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function SenderGroup({ icon, label, values }: { icon: keyof typeof Ionicons.glyphMap; label: string; values: string[] }) {
  const theme = useAppTheme();
  return (
    <View style={styles.senderGroup}>
      <View style={styles.senderHeading}><Ionicons name={icon} size={16} color={theme.textMuted} /><Text style={[styles.senderLabel, { color: theme.textMuted }]}>{label}</Text></View>
      <View style={styles.senderPills}>{values.map((value) => <View key={value} style={[styles.senderPill, { backgroundColor: theme.surfaceMuted }]}><Text selectable style={[styles.senderValue, { color: theme.text }]}>{value}</Text></View>)}</View>
    </View>
  );
}

function RecentMessage({ message, divider }: { message: DirectoryRecentMessage; divider: boolean }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/feed/[id]', params: { id: message.id, type: message.type } })}
      style={({ pressed }) => [styles.messageRow, divider && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }, { opacity: pressed ? 0.65 : 1 }]}>
      <View style={[styles.messageIcon, { backgroundColor: message.type === 'email' ? `${theme.red}14` : `${theme.blue}18` }]}>
        <Ionicons name={message.type === 'email' ? 'mail-outline' : 'chatbubble-outline'} size={18} color={message.type === 'email' ? theme.red : theme.blue} />
      </View>
      <View style={styles.messageCopy}>
        <Text numberOfLines={2} style={[styles.messageTitle, { color: theme.text }]}>{message.title}</Text>
        <Text numberOfLines={1} style={[styles.messageMeta, { color: theme.textMuted }]}>{formatDate(message.dateReceived)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xl },
  imageFrame: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, height: 148, justifyContent: 'center', overflow: 'hidden', width: 148 },
  image: { height: '100%', width: '100%' },
  initials: { fontSize: 42, fontWeight: '800' },
  name: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5, marginTop: spacing.lg, textAlign: 'center' },
  office: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md, marginTop: spacing.xs, textAlign: 'center' },
  follow: { marginTop: spacing.lg, minWidth: 190 },
  stats: { alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingVertical: spacing.lg },
  stat: { alignItems: 'center', flex: 1, gap: 3 },
  statValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { height: 44, width: StyleSheet.hairlineWidth },
  section: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, padding: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 22 },
  externalLink: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 44 },
  externalLinkText: { fontSize: 14, fontWeight: '700' },
  senderGroup: { gap: spacing.sm },
  senderHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  senderLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  senderPills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  senderPill: { borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  senderValue: { fontSize: 11, fontWeight: '600' },
  messageRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 72, paddingVertical: spacing.sm },
  messageIcon: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  messageCopy: { flex: 1 },
  messageTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  messageMeta: { fontSize: 11, marginTop: 4 },
});
