import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { PrimaryButton } from '@/components/primary-button';
import { radii, shadows, spacing, useAppTheme } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/providers/auth-provider';

const WEB_APP_URL = 'https://app.rip-tool.com';

export default function LoginScreen() {
  const theme = useAppTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresReset, setRequiresReset] = useState(false);

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setError(null);
    setRequiresReset(false);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (signInError) {
      if (signInError instanceof ApiError && signInError.code === 'PASSWORD_RESET_REQUIRED') {
        setRequiresReset(true);
      }
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = email.trim().length > 3 && password.length > 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <BrandLogo />
            <Text style={[styles.heading, { color: theme.text }]}>Political intelligence, in your pocket.</Text>
            <Text style={[styles.subheading, { color: theme.textMuted }]}>Sign in with your existing RIP Tool account.</Text>
          </View>

          <View style={[styles.card, shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@campaign.com"
                placeholderTextColor={theme.textMuted}
                returnKeyType="next"
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                textContentType="username"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Password</Text>
              <View style={[styles.passwordRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  onChangeText={setPassword}
                  onSubmitEditing={() => canSubmit && void handleSignIn()}
                  placeholder="Your password"
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="go"
                  secureTextEntry={!showPassword}
                  style={[styles.passwordInput, { color: theme.text }]}
                  textContentType="password"
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  hitSlop={8}
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: `${theme.danger}12` }]} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" color={theme.danger} size={20} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton label="Sign in" onPress={() => void handleSignIn()} loading={submitting} disabled={!canSubmit} />

            <Pressable
              accessibilityRole="link"
              onPress={() => void WebBrowser.openBrowserAsync(`${WEB_APP_URL}/reset-password`)}
              style={styles.linkButton}>
              <Text style={[styles.linkText, { color: theme.red }]}>
                {requiresReset ? 'Reset your password to continue' : 'Forgot password?'}
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  heading: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  field: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  passwordRow: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 50,
    paddingLeft: spacing.lg,
  },
  eyeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: 50,
  },
  errorBox: {
    alignItems: 'flex-start',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  linkText: { fontSize: 14, fontWeight: '700' },
});
