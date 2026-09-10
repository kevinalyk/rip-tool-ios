import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { PrimaryButton } from '@/components/primary-button';
import { PRODUCT_NAME } from '@/constants/branding';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';

type FaceIdGateProps = {
  error: string | null;
  onUnlock: () => void;
  onUsePassword: () => void;
};

export function FaceIdGate({ error, onUnlock, onUsePassword }: FaceIdGateProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <BrandLogo />
        <View style={[styles.card, shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.red}12` }]}>
            <Image source="sf:faceid" style={styles.icon} tintColor={theme.red} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Unlock {PRODUCT_NAME}</Text>
          <Text style={[styles.message, { color: error ? theme.danger : theme.textMuted }]}>
            {error || 'Use Face ID to securely restore your saved session.'}
          </Text>
          <PrimaryButton label="Unlock with Face ID" onPress={onUnlock} style={styles.button} />
          <Pressable accessibilityRole="button" onPress={onUsePassword} style={styles.passwordButton}>
            <Text style={[styles.passwordText, { color: theme.red }]}>Use password instead</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  card: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xxl,
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 38,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  icon: { height: 42, width: 42 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, paddingTop: spacing.lg },
  message: { fontSize: 14, lineHeight: 21, paddingTop: spacing.sm, textAlign: 'center' },
  button: { marginTop: spacing.xl, width: '100%' },
  passwordButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingTop: spacing.sm },
  passwordText: { fontSize: 14, fontWeight: '700' },
});
