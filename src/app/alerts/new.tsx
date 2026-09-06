import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentState } from '@/components/content-state';
import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { CreateAlertInput, SelectOption } from '@/lib/api/types';

type ChoiceRowProps = {
  title: string;
  value?: string;
  options: SelectOption[];
  onChange: (value?: string) => void;
};

function ChoiceRow({ title, value, options, onChange }: ChoiceRowProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.choiceSection}>
      <Text style={[styles.label, { color: theme.text }]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        <Choice label="Any" selected={!value} onPress={() => onChange(undefined)} />
        {options.map((option) => (
          <Choice key={option.value} label={option.label} selected={value === option.value} onPress={() => onChange(option.value)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? theme.navy : theme.surface,
          borderColor: selected ? theme.navy : theme.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}>
      <Text style={[styles.choiceText, { color: selected ? '#FFFFFF' : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

export default function NewAlertScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const options = useQuery({ queryKey: ['feed-filters'], queryFn: mobileApi.feedFilters });
  const [name, setName] = useState('');
  const [party, setParty] = useState<string>();
  const [state, setState] = useState<string>();
  const [office, setOffice] = useState<string>();

  const createAlert = useMutation({
    mutationFn: (input: CreateAlertInput) => mobileApi.createAlert(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      router.back();
    },
    onError: (error) => Alert.alert('Couldn’t create alert', error instanceof Error ? error.message : 'Please try again.'),
  });

  if (options.isLoading) {
    return <ContentState mode="loading" message="Loading alert options…" />;
  }

  if (options.isError || !options.data) {
    return (
      <ContentState
        mode="error"
        title="Couldn’t load alert options"
        message={options.error instanceof Error ? options.error.message : undefined}
        actionLabel="Try again"
        onAction={() => void options.refetch()}
      />
    );
  }

  const canSubmit = Boolean(name.trim() && (party || state || office));
  const stateOptions = options.data.states.map((item) => ({ value: item, label: item }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={92}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Create campaign alert</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Choose at least one criterion. You can combine filters for a narrower alert.</Text>
          </View>

          <View style={styles.nameField}>
            <Text style={[styles.label, { color: theme.text }]}>Alert name</Text>
            <TextInput
              accessibilityLabel="Alert name"
              autoFocus
              maxLength={80}
              onChangeText={setName}
              placeholder="e.g. Republican Senate activity"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={name}
            />
          </View>

          <ChoiceRow title="Party" value={party} options={options.data.parties} onChange={setParty} />
          <ChoiceRow title="Office" value={office} options={options.data.offices} onChange={setOffice} />
          <ChoiceRow title="State" value={state} options={stateOptions} onChange={setState} />

          <PrimaryButton
            label="Create alert"
            loading={createAlert.isPending}
            disabled={!canSubmit}
            onPress={() => createAlert.mutate({ name: name.trim(), party, state, office })}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  nameField: { gap: spacing.sm },
  label: { fontSize: 15, fontWeight: '700' },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  choiceSection: { gap: spacing.md },
  choiceRow: { gap: spacing.sm, paddingRight: spacing.lg },
  choice: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  choiceText: { fontSize: 14, fontWeight: '600' },
});
