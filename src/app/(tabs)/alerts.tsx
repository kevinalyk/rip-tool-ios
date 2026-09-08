import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { OfflineBanner } from '@/components/offline-banner';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { AlertSubscription } from '@/lib/api/types';
import { getMobileEntitlements } from '@/lib/entitlements';
import { titleCase } from '@/lib/format';
import { enablePushNotifications, getPushPermissionState, syncPushNotificationsIfGranted } from '@/lib/notifications';
import { useAuth } from '@/providers/auth-provider';

function alertCriteria(item: AlertSubscription): string[] {
  const message = item.messageTypes.length === 1 ? item.messageTypes[0].toUpperCase() : null;
  const ownership = item.ownershipTypes.length === 1
    ? item.ownershipTypes[0] === 'house_file' ? 'House File' : 'Third Party'
    : null;
  return [
    item.search ? `“${item.search}”` : null,
    item.entityIds.length ? `${item.entityIds.length} ${item.entityIds.length === 1 ? 'entity' : 'entities'}` : null,
    titleCase(item.party),
    item.state,
    titleCase(item.entityType),
    message,
    ownership,
    item.donationPlatform ? titleCase(item.donationPlatform) : null,
    item.subscriptionsOnly ? 'Following only' : null,
    item.tag ? `Tag: ${item.tag}` : null,
  ].filter((value): value is string => Boolean(value));
}

export default function AlertsScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const canUseAlerts = getMobileEntitlements(user).canUseAlerts;
  const queryClient = useQueryClient();
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: mobileApi.alerts, enabled: canUseAlerts });
  const permission = useQuery({ queryKey: ['push-permission'], queryFn: getPushPermissionState, enabled: canUseAlerts });
  const { mutate: syncNotifications, status: syncStatus, isError: syncError } = useMutation({ mutationFn: syncPushNotificationsIfGranted });
  const enableNotifications = useMutation({
    mutationFn: enablePushNotifications,
    onSuccess: async (state) => {
      await queryClient.invalidateQueries({ queryKey: ['push-permission'] });
      if (state === 'denied') {
        Alert.alert('Notifications are off', 'Allow notifications for Inbox.GOP in iPhone Settings.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
      } else if (state === 'unavailable') {
        Alert.alert('Use a real iPhone', 'Remote push notifications can’t be enabled in the iOS Simulator.');
      }
    },
    onError: (error) => Alert.alert('Couldn’t enable notifications', error instanceof Error ? error.message : 'Please try again.'),
  });
  const removeAlert = useMutation({
    mutationFn: mobileApi.deleteAlert,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
    onError: (error) => Alert.alert('Couldn’t delete alert', error instanceof Error ? error.message : 'Please try again.'),
  });

  useEffect(() => {
    if (permission.data === 'granted' && syncStatus === 'idle') syncNotifications();
  }, [permission.data, syncNotifications, syncStatus]);

  const confirmDelete = (item: AlertSubscription) => {
    Alert.alert('Delete alert?', `You’ll stop receiving notifications for “${item.name}.”`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAlert.mutate(item.id) },
    ]);
  };

  if (!canUseAlerts) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <View style={styles.lockedWrap}>
          <View style={[styles.lockedCard, shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.largeIcon, { backgroundColor: `${theme.red}14` }]}><Ionicons name="notifications-outline" size={30} color={theme.red} /></View>
            <Text style={[styles.lockedTitle, { color: theme.text }]}>Real-time CI alerts</Text>
            <Text style={[styles.lockedText, { color: theme.textMuted }]}>Push alerts are available on paid plans. Upgrade on the web to get notified when new email or SMS activity matches your criteria.</Text>
          </View>
        </View>
      </View>
    );
  }

  if (alerts.isLoading) return <View style={[styles.flex, { backgroundColor: theme.background }]}><OfflineBanner /><ContentState mode="loading" message="Loading alerts…" /></View>;
  if (alerts.isError && !alerts.data) {
    return <View style={[styles.flex, { backgroundColor: theme.background }]}><OfflineBanner /><ContentState mode="error" title="Couldn’t load alerts" message={alerts.error instanceof Error ? alerts.error.message : undefined} actionLabel="Try again" onAction={() => void alerts.refetch()} /></View>;
  }

  const items = alerts.data?.data || [];
  const permissionState = permission.data;
  const needsRegistrationRetry = permissionState === 'granted' && syncError;
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={alerts.isRefetching} onRefresh={() => void alerts.refetch()} tintColor={theme.red} />}
        contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]}
        ListHeaderComponent={<View>
          <View style={styles.header}>
            <View style={styles.headingBlock}><Text style={[styles.title, { color: theme.text }]}>Alerts</Text><Text style={[styles.subtitle, { color: theme.textMuted }]}>Get notified when new CI messages match what matters to you.</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Create alert" onPress={() => router.push('/alerts/new')} style={({ pressed }) => [styles.addButton, { backgroundColor: theme.red, opacity: pressed ? 0.76 : 1 }]}><Ionicons name="add" size={24} color="#FFFFFF" /></Pressable>
          </View>
          {permissionState !== 'granted' || needsRegistrationRetry ? (
            <Pressable accessibilityRole="button" onPress={() => needsRegistrationRetry ? syncNotifications() : permissionState === 'denied' ? void Linking.openSettings() : enableNotifications.mutate()} style={({ pressed }) => [styles.permissionCard, { backgroundColor: theme.navy, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="notifications" size={23} color="#FFFFFF" />
              <View style={styles.permissionText}><Text style={styles.permissionTitle}>{needsRegistrationRetry ? 'Finish notification setup' : permissionState === 'denied' ? 'Turn on notifications in Settings' : 'Enable push notifications'}</Text><Text style={styles.permissionBody}>{needsRegistrationRetry ? 'Your iPhone gave permission, but registration did not finish. Tap to retry.' : 'Alerts are saved, but your iPhone needs permission to show them.'}</Text></View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>}
        ListEmptyComponent={<ContentState mode="empty" title="No alerts yet" message="Create your first alert and choose exactly which new emails or texts should notify you." actionLabel="Create alert" onAction={() => router.push('/alerts/new')} />}
        renderItem={({ item }) => {
          const criteria = alertCriteria(item);
          const pending = removeAlert.isPending && removeAlert.variables === item.id;
          return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.red}14` }]}><Ionicons name="notifications-outline" size={23} color={theme.red} /></View>
            <View style={styles.alertInfo}><Text style={[styles.alertName, { color: theme.text }]}>{item.name}</Text><View style={styles.criteriaRow}>{(criteria.length ? criteria : ['All new CI messages']).map((criterion) => <View key={criterion} style={[styles.criterion, { backgroundColor: theme.surfaceMuted }]}><Text style={[styles.criterionText, { color: theme.textMuted }]}>{criterion}</Text></View>)}</View></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`} disabled={pending} onPress={() => confirmDelete(item)} style={({ pressed }) => [styles.deleteButton, { opacity: pressed || pending ? 0.45 : 1 }]}><Ionicons name={pending ? 'ellipsis-horizontal' : 'trash-outline'} size={21} color={theme.danger} /></Pressable>
          </View>;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { padding: spacing.lg, paddingBottom: spacing.xxl }, emptyContent: { flexGrow: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }, headingBlock: { flex: 1 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 }, subtitle: { fontSize: 15, lineHeight: 21, marginTop: spacing.sm },
  addButton: { alignItems: 'center', borderRadius: radii.md, height: 48, justifyContent: 'center', marginLeft: spacing.md, width: 48 },
  permissionCard: { alignItems: 'center', borderRadius: radii.lg, flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, minHeight: 82, padding: spacing.lg },
  permissionText: { flex: 1, gap: 3 }, permissionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, permissionBody: { color: '#D7E3E9', fontSize: 12, lineHeight: 17 },
  card: { alignItems: 'flex-start', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, padding: spacing.lg },
  iconBox: { alignItems: 'center', borderRadius: radii.md, height: 44, justifyContent: 'center', width: 44 }, alertInfo: { flex: 1 }, alertName: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  criteriaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm }, criterion: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 }, criterionText: { fontSize: 11, fontWeight: '600' },
  deleteButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }, lockedWrap: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  lockedCard: { alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xxl }, largeIcon: { alignItems: 'center', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  lockedTitle: { fontSize: 22, fontWeight: '800', marginTop: spacing.lg }, lockedText: { fontSize: 15, lineHeight: 22, marginTop: spacing.sm, textAlign: 'center' },
});
