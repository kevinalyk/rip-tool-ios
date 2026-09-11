import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { EntityAvatar } from '@/components/entity-avatar';
import { OfflineBanner } from '@/components/offline-banner';
import { PRODUCT_NAME } from '@/constants/branding';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import { getDeviceId } from '@/lib/api/client';
import type { Entity } from '@/lib/api/types';
import { canFollowNewEntities, getMobileEntitlements } from '@/lib/entitlements';
import { titleCase } from '@/lib/format';
import {
  disableFollowingPushNotifications,
  enableFollowingPushNotifications,
  getPushPermissionState,
  syncFollowingPushNotificationsIfEnabled,
} from '@/lib/notifications';
import { useAuth } from '@/providers/auth-provider';

export default function FollowingScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const entitlements = getMobileEntitlements(user);
  const canAddFollows = canFollowNewEntities(entitlements);
  const followed = useQuery({ queryKey: ['followed-entities'], queryFn: mobileApi.followedEntities });
  const followingNotifications = useQuery({
    queryKey: ['following-push-preference'],
    queryFn: async () => {
      const [permission, response] = await Promise.all([
        getPushPermissionState(),
        getDeviceId().then(mobileApi.followingPushPreference),
      ]);
      await syncFollowingPushNotificationsIfEnabled(response.data.enabled);
      return { permission, preference: response.data };
    },
  });
  const refetchFollowingNotifications = followingNotifications.refetch;
  const updateNotifications = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!enabled) {
        await disableFollowingPushNotifications();
        return;
      }
      const permission = await enableFollowingPushNotifications();
      if (permission === 'denied') {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for Inbox.GOP in iPhone Settings, then return here to turn this on.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
      } else if (permission === 'unavailable') {
        Alert.alert('Use a real iPhone', 'Push notifications can only be enabled on a physical iPhone.');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['following-push-preference'] }),
    onError: (error) => Alert.alert(
      'Couldn’t update notifications',
      error instanceof Error ? error.message : 'Please try again.',
    ),
  });

  useFocusEffect(useCallback(() => {
    void refetchFollowingNotifications();
  }, [refetchFollowingNotifications]));
  const unfollow = useMutation({
    mutationFn: mobileApi.unfollowEntity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['followed-entities'] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => Alert.alert('Couldn’t unfollow', error instanceof Error ? error.message : 'Please try again.'),
  });

  const confirmUnfollow = (entity: Entity) => {
    Alert.alert('Unfollow entity?', `${PRODUCT_NAME} will stop prioritizing messages from ${entity.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unfollow', style: 'destructive', onPress: () => unfollow.mutate(entity.id) },
    ]);
  };

  if (followed.isLoading) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState mode="loading" message="Loading followed entities…" />
      </View>
    );
  }

  if (followed.isError && !followed.data) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState
          mode="error"
          title="Couldn’t load following"
          message={followed.error instanceof Error ? followed.error.message : undefined}
          actionLabel="Try again"
          onAction={() => void followed.refetch()}
        />
      </View>
    );
  }

  const entities = followed.data?.data || [];
  const notificationPermission = followingNotifications.data?.permission;
  const notificationsEnabled =
    notificationPermission === 'granted' && followingNotifications.data?.preference.enabled === true;
  const notificationsUnavailable = notificationPermission === 'unavailable';

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={entities}
        keyExtractor={(entity) => entity.id}
        refreshControl={
          <RefreshControl
            refreshing={followed.isRefetching}
            onRefresh={() => void Promise.allSettled([
              followed.refetch(),
              refetchFollowingNotifications(),
              refreshProfile(),
            ])}
            tintColor={theme.red}
          />
        }
        contentContainerStyle={[styles.content, entities.length === 0 && styles.emptyContent]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Following</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Your organization’s priority entities and campaigns.</Text>
            <View style={[styles.notificationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.notificationIcon, { backgroundColor: `${theme.red}14` }]}>
                <Ionicons name="notifications-outline" size={23} color={theme.red} />
              </View>
              <View style={styles.notificationCopy}>
                <Text style={[styles.notificationTitle, { color: theme.text }]}>Following notifications</Text>
                <Text style={[styles.notificationBody, { color: theme.textMuted }]}>
                  Get a push when any entity you follow sends an email or SMS.
                </Text>
                {notificationPermission === 'denied' ? (
                  <Text style={[styles.notificationStatus, { color: theme.red }]}>Off in iPhone Settings</Text>
                ) : notificationsUnavailable ? (
                  <Text style={[styles.notificationStatus, { color: theme.textMuted }]}>Available on a physical iPhone</Text>
                ) : null}
              </View>
              <Switch
                accessibilityLabel="Following notifications"
                accessibilityHint="Receive notifications for new emails and SMS messages from followed entities"
                disabled={followingNotifications.isLoading || updateNotifications.isPending || notificationsUnavailable}
                onValueChange={(enabled) => updateNotifications.mutate(enabled)}
                trackColor={{ false: theme.border, true: theme.red }}
                value={notificationsEnabled}
              />
            </View>
            {!canAddFollows ? (
              <View style={[styles.accessNotice, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={19} color={theme.red} />
                <Text style={[styles.accessNoticeText, { color: theme.textMuted }]}>
                  Following entities is available on paid plans. Existing follows can still be removed.
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <ContentState
            mode="empty"
            title="No followed entities"
            message={
              canAddFollows
                ? 'Open a message in the Feed and tap Follow to begin building your watchlist.'
                : 'Your current plan does not include followed entities.'
            }
          />
        }
        renderItem={({ item }) => {
          const pending = unfollow.isPending && unfollow.variables === item.id;
          return (
            <Pressable
              accessibilityHint="Opens this entity in the Directory"
              accessibilityLabel={`View ${item.name}`}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/directory/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
              ]}>
              <EntityAvatar name={item.name} imageUrl={item.imageUrl} size={50} />
              <View style={styles.entityInfo}>
                <Text numberOfLines={2} style={[styles.entityName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {[titleCase(item.party), item.state, titleCase(item.type)].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Unfollow ${item.name}`}
                disabled={pending}
                onPress={(event) => {
                  event.stopPropagation();
                  confirmUnfollow(item);
                }}
                style={({ pressed }) => [styles.unfollowButton, { opacity: pressed || pending ? 0.5 : 1 }]}>
                <Ionicons name={pending ? 'ellipsis-horizontal' : 'star'} size={22} color={theme.red} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContent: { flexGrow: 1 },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: spacing.sm },
  accessNotice: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  notificationCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  notificationIcon: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  notificationCopy: { flex: 1, gap: 3 },
  notificationTitle: { fontSize: 15, fontWeight: '700' },
  notificationBody: { fontSize: 12, lineHeight: 17 },
  notificationStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  accessNoticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  card: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    minHeight: 78,
    padding: spacing.md,
  },
  entityInfo: { flex: 1 },
  entityName: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  meta: { fontSize: 12, marginTop: 3 },
  unfollowButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
