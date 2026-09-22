import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

export default function MobileAccessScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ kind?: string; cancelApple?: string }>();
  const entitlements = user?.client?.entitlements;
  const covered = params.kind === 'covered' || entitlements?.clientPlanCoversMobile === true;
  const shouldCancel = params.cancelApple === 'true' || entitlements?.shouldPromptAppleCancellation === true;
  const personal = entitlements?.accessSource === 'apple_personal';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.red}18` }]}>
          <Ionicons name={covered ? 'shield-checkmark-outline' : 'phone-portrait-outline'} color={theme.red} size={34} />
        </View>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>
            {covered ? 'Your mobile access is covered' : personal ? 'Inbox.GOP Personal' : 'Your mobile access'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {covered
              ? `${user?.client?.name || 'Your organization'} includes complete Inbox.GOP mobile access for your account.`
              : personal
                ? 'Your Apple Personal subscription provides complete mobile access while your web workspace remains on its current plan.'
                : 'You currently have the mobile access included with your web workspace.'}
          </Text>
        </View>

        {shouldCancel ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeading}>
              <Ionicons name="alert-circle-outline" color={theme.red} size={24} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Avoid paying twice</Text>
            </View>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              Apple subscriptions cannot be cancelled by Inbox.GOP. Open Apple’s subscription settings and cancel Inbox.GOP Personal. Your organization-provided mobile access will continue.
            </Text>
            <PrimaryButton
              label="Manage Apple subscription"
              onPress={() => void Linking.openURL(APPLE_SUBSCRIPTIONS_URL)}
              accessibilityHint="Opens your Apple subscription settings"
            />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>How access works</Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              A qualifying web plan covers the people assigned to that workspace. Inbox.GOP Personal is purchased separately through Apple for individual mobile access.
            </Text>
            <PrimaryButton
              label="Manage Apple subscriptions"
              variant="secondary"
              onPress={() => void Linking.openURL(APPLE_SUBSCRIPTIONS_URL)}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { alignItems: 'center', gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  heroIcon: { alignItems: 'center', borderRadius: 34, height: 68, justifyContent: 'center', marginTop: spacing.lg, width: 68 },
  heading: { gap: spacing.sm, maxWidth: 540 },
  title: { fontSize: 29, fontWeight: '800', letterSpacing: -0.7, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  card: { borderCurve: 'continuous', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, gap: spacing.lg, maxWidth: 540, padding: spacing.xl, width: '100%' },
  cardHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  cardTitle: { fontSize: 19, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 23 },
});
