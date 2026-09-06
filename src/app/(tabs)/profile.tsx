import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/offline-banner';
import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { initials, titleCase } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

const WEB_APP_URL = 'https://app.rip-tool.com';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: theme.surfaceMuted }]}>
        <Ionicons name={icon} size={20} color={theme.navy} />
      </View>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: theme.textMuted }]}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={19} color={theme.textMuted} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.65 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { user, signOut, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      Alert.alert('Couldn’t refresh profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You’ll need your email and password to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            // Local credentials are cleared even if the network logout fails.
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={theme.red} />}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>Your profile</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Account and organization details.</Text>
        </View>

        <View style={[styles.identityCard, { backgroundColor: theme.navy }]}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: theme.navy }]}>{initials(user.firstName, user.lastName, user.email)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{titleCase(user.role)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ORGANIZATION</Text>
          <SettingsRow icon="business-outline" label="Organization" value={user.client?.name || 'Not assigned'} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsRow icon="layers-outline" label="Plan" value={titleCase(user.client?.subscriptionPlan) || '—'} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsRow icon="pulse-outline" label="Status" value={titleCase(user.client?.subscriptionStatus) || '—'} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>HELP & LEGAL</Text>
          <SettingsRow icon="key-outline" label="Reset password" onPress={() => void WebBrowser.openBrowserAsync(`${WEB_APP_URL}/reset-password`)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsRow icon="help-circle-outline" label="Support" onPress={() => void Linking.openURL('mailto:support@rip-tool.com')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsRow icon="shield-checkmark-outline" label="Privacy policy" onPress={() => void WebBrowser.openBrowserAsync(`${WEB_APP_URL}/privacy`)} />
        </View>

        <PrimaryButton label="Sign out" variant="secondary" loading={signingOut} onPress={confirmSignOut} />
        <Text style={[styles.version, { color: theme.textMuted }]}>RIP Tool for iPhone · Version {Constants.expoConfig?.version || '1.0.0'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { gap: spacing.sm },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 15 },
  identityCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 31,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  avatarText: { fontSize: 21, fontWeight: '800' },
  identityText: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  email: { color: 'rgba(255,255,255,0.74)', fontSize: 14, marginTop: 3 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  roleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  section: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, paddingBottom: spacing.sm, paddingTop: spacing.lg },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 62 },
  rowIcon: { alignItems: 'center', borderRadius: radii.sm, height: 34, justifyContent: 'center', width: 34 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 14, maxWidth: 140, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 46 },
  version: { fontSize: 12, textAlign: 'center' },
});
