import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { PrimaryButton } from '@/components/primary-button';
import { PRODUCT_NAME } from '@/constants/branding';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/links';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { validateSignup, type SignupFormValues } from '@/lib/signup';
import { useAuth } from '@/providers/auth-provider';

const EMPTY_FORM: SignupFormValues = {
  clientName: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  agreeToPrivacy: false,
};

type TextFieldName = Exclude<keyof SignupFormValues, 'agreeToTerms' | 'agreeToPrivacy'>;

export default function SignupScreen() {
  const theme = useAppTheme();
  const { signUp } = useAuth();
  const formLoadedAt = useRef(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    formLoadedAt.current = Date.now();
  }, []);

  const updateText = (field: TextFieldName, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    Keyboard.dismiss();
    const validationError = validateSignup(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signUp({
        clientName: form.clientName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        formLoadedAt: formLoadedAt.current,
      });
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>Create your {PRODUCT_NAME} account</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Register your organization and start on the Free plan.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SignupField
            label="Organization name"
            value={form.clientName}
            onChangeText={(value) => updateText('clientName', value)}
            autoComplete="organization"
            textContentType="organizationName"
            placeholder="Campaign or organization"
          />

          <View style={styles.nameRow}>
            <View style={styles.flex}>
              <SignupField
                label="First name"
                value={form.firstName}
                onChangeText={(value) => updateText('firstName', value)}
                autoComplete="name-given"
                textContentType="givenName"
                placeholder="First"
              />
            </View>
            <View style={styles.flex}>
              <SignupField
                label="Last name"
                value={form.lastName}
                onChangeText={(value) => updateText('lastName', value)}
                autoComplete="name-family"
                textContentType="familyName"
                placeholder="Last"
              />
            </View>
          </View>

          <SignupField
            label="Email"
            value={form.email}
            onChangeText={(value) => updateText('email', value)}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@organization.com"
          />

          <PasswordField
            label="Password"
            value={form.password}
            onChangeText={(value) => updateText('password', value)}
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            textContentType="newPassword"
          />
          <Text style={[styles.passwordHelp, { color: theme.textMuted }]}>At least 12 characters with a letter, number, and symbol.</Text>

          <PasswordField
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={(value) => updateText('confirmPassword', value)}
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((current) => !current)}
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
          />

          <View style={[styles.planNote, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="information-circle-outline" size={21} color={theme.navy} />
            <Text style={[styles.planNoteText, { color: theme.textMuted }]}>Free accounts receive a delayed one-hour feed window. You can upgrade on the website later.</Text>
          </View>

          <ConsentRow
            checked={form.agreeToTerms}
            label="I agree to the"
            linkLabel="Terms of Service"
            onToggle={() => setForm((current) => ({ ...current, agreeToTerms: !current.agreeToTerms }))}
            onOpen={() => void WebBrowser.openBrowserAsync(TERMS_OF_SERVICE_URL)}
          />
          <ConsentRow
            checked={form.agreeToPrivacy}
            label="I agree to the"
            linkLabel="Privacy Policy"
            onToggle={() => setForm((current) => ({ ...current, agreeToPrivacy: !current.agreeToPrivacy }))}
            onOpen={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          />

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: `${theme.danger}12` }]} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" color={theme.danger} size={20} />
              <Text selectable style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton label="Create account" loading={submitting} onPress={() => void submit()} />
          <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.signInLink}>
            <Text style={[styles.signInCopy, { color: theme.textMuted }]}>Already have an account? </Text>
            <Text style={[styles.signInCopy, { color: theme.red, fontWeight: '700' }]}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SignupField(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const theme = useAppTheme();
  const { label, style, ...inputProps } = props;
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        autoCorrect={false}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }, style]}
      />
    </View>
  );
}

function PasswordField({ visible, onToggle, ...props }: React.ComponentProps<typeof TextInput> & { label: string; visible: boolean; onToggle: () => void }) {
  const theme = useAppTheme();
  const { label, ...inputProps } = props;
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.passwordRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={!visible}
          style={[styles.passwordInput, { color: theme.text }]}
        />
        <Pressable accessibilityRole="button" accessibilityLabel={visible ? `Hide ${label}` : `Show ${label}`} onPress={onToggle} style={styles.eyeButton}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function ConsentRow({ checked, label, linkLabel, onToggle, onOpen }: { checked: boolean; label: string; linkLabel: string; onToggle: () => void; onOpen: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.consentRow}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={`${label} ${linkLabel}`} onPress={onToggle} style={styles.checkboxButton}>
        <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={checked ? theme.red : theme.textMuted} />
      </Pressable>
      <Text style={[styles.consentText, { color: theme.text }]}>{label} </Text>
      <Pressable accessibilityRole="link" onPress={onOpen} style={styles.inlineLink}>
        <Text style={[styles.consentText, { color: theme.red, fontWeight: '700' }]}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { gap: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  card: { borderCurve: 'continuous', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, gap: spacing.lg, padding: spacing.lg },
  field: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '700' },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  input: { borderRadius: radii.md, borderWidth: 1, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg },
  passwordRow: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 52 },
  passwordInput: { flex: 1, fontSize: 16, minHeight: 50, paddingLeft: spacing.lg },
  eyeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50, width: 50 },
  passwordHelp: { fontSize: 12, lineHeight: 17, marginTop: -spacing.md },
  planNote: { alignItems: 'flex-start', borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  planNoteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  consentRow: { alignItems: 'center', flexDirection: 'row', minHeight: 44 },
  checkboxButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, width: 36 },
  consentText: { fontSize: 14 },
  inlineLink: { justifyContent: 'center', minHeight: 44 },
  errorBox: { alignItems: 'flex-start', borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  signInLink: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', minHeight: 44 },
  signInCopy: { fontSize: 14 },
});
