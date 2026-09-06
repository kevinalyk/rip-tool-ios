import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { OfflineBanner } from '@/components/offline-banner';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { AlertSubscription } from '@/lib/api/types';
import { titleCase } from '@/lib/format';

export default function AlertsScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: mobileApi.alerts });
  const removeAlert = useMutation({
    mutationFn: mobileApi.deleteAlert,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
    onError: (error) => Alert.alert('Couldn’t delete alert', error instanceof Error ? error.message : 'Please try again.'),
  });

  const confirmDelete = (alert: AlertSubscription) => {
    Alert.alert('Delete alert?', `You’ll stop receiving updates for “${alert.name}.”`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAlert.mutate(alert.id) },
    ]);
  };

  if (alerts.isLoading) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState mode="loading" message="Loading alerts…" />
      </View>
    );
  }

  if (alerts.isError && !alerts.data) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <ContentState
          mode="error"
          title="Couldn’t load alerts"
          message={alerts.error instanceof Error ? alerts.error.message : undefined}
          actionLabel="Try again"
          onAction={() => void alerts.refetch()}
        />
      </View>
    );
  }

  const items = alerts.data?.data || [];

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={alerts.isRefetching} onRefresh={() => void alerts.refetch()} tintColor={theme.red} />}
        contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headingBlock}>
              <Text style={[styles.title, { color: theme.text }]}>Campaign alerts</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>Stay on top of new political activity.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create alert"
              onPress={() => router.push('/alerts/new')}
              style={({ pressed }) => [styles.addButton, { backgroundColor: theme.red, opacity: pressed ? 0.76 : 1 }]}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <ContentState
            mode="empty"
            title="No campaign alerts"
            message="Create an alert for a party, state, or office and we’ll keep it organized here."
            actionLabel="Create alert"
            onAction={() => router.push('/alerts/new')}
          />
        }
        renderItem={({ item }) => {
          const criteria = [titleCase(item.party), item.state, titleCase(item.office)].filter(Boolean);
          const pending = removeAlert.isPending && removeAlert.variables === item.id;
          return (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: `${theme.red}14` }]}>
                <Ionicons name="notifications-outline" size={23} color={theme.red} />
              </View>
              <View style={styles.alertInfo}>
                <Text style={[styles.alertName, { color: theme.text }]}>{item.name}</Text>
                <View style={styles.criteriaRow}>
                  {criteria.map((criterion) => (
                    <View key={criterion} style={[styles.criterion, { backgroundColor: theme.surfaceMuted }]}>
                      <Text style={[styles.criterionText, { color: theme.textMuted }]}>{criterion}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
                disabled={pending}
                onPress={() => confirmDelete(item)}
                style={({ pressed }) => [styles.deleteButton, { opacity: pressed || pending ? 0.45 : 1 }]}>
                <Ionicons name={pending ? 'ellipsis-horizontal' : 'trash-outline'} size={21} color={theme.danger} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyContent: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headingBlock: { flex: 1 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: spacing.sm },
  addButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 48,
    justifyContent: 'center',
    marginLeft: spacing.md,
    width: 48,
  },
  card: {
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  criteriaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  criterion: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  criterionText: { fontSize: 11, fontWeight: '600' },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
