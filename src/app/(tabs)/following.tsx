import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ContentState } from '@/components/content-state';
import { EntityAvatar } from '@/components/entity-avatar';
import { OfflineBanner } from '@/components/offline-banner';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { Entity } from '@/lib/api/types';
import { titleCase } from '@/lib/format';

export default function FollowingScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const followed = useQuery({ queryKey: ['followed-entities'], queryFn: mobileApi.followedEntities });
  const unfollow = useMutation({
    mutationFn: mobileApi.unfollowEntity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['followed-entities'] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => Alert.alert('Couldn’t unfollow', error instanceof Error ? error.message : 'Please try again.'),
  });

  const confirmUnfollow = (entity: Entity) => {
    Alert.alert('Unfollow entity?', `RIP Tool will stop prioritizing messages from ${entity.name}.`, [
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

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        data={entities}
        keyExtractor={(entity) => entity.id}
        refreshControl={
          <RefreshControl refreshing={followed.isRefetching} onRefresh={() => void followed.refetch()} tintColor={theme.red} />
        }
        contentContainerStyle={[styles.content, entities.length === 0 && styles.emptyContent]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Following</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Your organization’s priority entities and campaigns.</Text>
          </View>
        }
        ListEmptyComponent={
          <ContentState
            mode="empty"
            title="No followed entities"
            message="Open a message in the Feed and tap Follow to begin building your watchlist."
          />
        }
        renderItem={({ item }) => {
          const pending = unfollow.isPending && unfollow.variables === item.id;
          return (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                onPress={() => confirmUnfollow(item)}
                style={({ pressed }) => [styles.unfollowButton, { opacity: pressed || pending ? 0.5 : 1 }]}>
                <Ionicons name={pending ? 'ellipsis-horizontal' : 'star'} size={22} color={theme.red} />
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContent: { flexGrow: 1 },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: spacing.sm },
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
