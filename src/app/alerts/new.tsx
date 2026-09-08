import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentState } from '@/components/content-state';
import { FilterSelectionSheet, type FilterSelectionOption } from '@/components/filter-selection-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { radii, spacing, useAppTheme } from '@/constants/theme';
import { mobileApi } from '@/lib/api/endpoints';
import type { CreateAlertInput, SelectOption } from '@/lib/api/types';
import { getMobileEntitlements } from '@/lib/entitlements';
import { titleCase } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.choice, { backgroundColor: selected ? theme.navy : theme.surface, borderColor: selected ? theme.navy : theme.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.choiceText, { color: selected ? '#FFFFFF' : theme.text }]}>{label}</Text></Pressable>;
}

function SingleChoice({ title, value, options, onChange }: { title: string; value?: string; options: readonly SelectOption[]; onChange: (value?: string) => void }) {
  const theme = useAppTheme();
  return <View style={styles.section}><Text style={[styles.label, { color: theme.text }]}>{title}</Text><View style={styles.choiceRow}><Choice label="Any" selected={!value} onPress={() => onChange(undefined)} />{options.map((option) => <Choice key={option.value} label={option.label} selected={value === option.value} onPress={() => onChange(option.value)} />)}</View></View>;
}

function MultiChoice({ title, helper, values, options, onChange }: { title: string; helper: string; values: string[]; options: readonly SelectOption[]; onChange: (values: string[]) => void }) {
  const theme = useAppTheme();
  const toggle = (value: string) => onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  return <View style={styles.section}><Text style={[styles.label, { color: theme.text }]}>{title}</Text><Text style={[styles.helper, { color: theme.textMuted }]}>{helper}</Text><View style={styles.choiceRow}>{options.map((option) => <Choice key={option.value} label={option.label} selected={values.includes(option.value)} onPress={() => toggle(option.value)} />)}</View></View>;
}

function SelectionRow({ icon, title, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; onPress: () => void }) {
  const theme = useAppTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.selectionRow, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.selectionIcon, { backgroundColor: theme.surfaceMuted }]}><Ionicons name={icon} size={20} color={theme.navy} /></View><View style={styles.selectionText}><Text style={[styles.label, { color: theme.text }]}>{title}</Text><Text numberOfLines={1} style={[styles.selectionValue, { color: theme.textMuted }]}>{value}</Text></View><Ionicons name="chevron-forward" size={19} color={theme.textMuted} /></Pressable>;
}

export default function NewAlertScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const canUseAlerts = getMobileEntitlements(user).canUseAlerts;
  const queryClient = useQueryClient();
  const options = useQuery({ queryKey: ['alert-options'], queryFn: mobileApi.alertOptions, enabled: canUseAlerts });
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [party, setParty] = useState<string>();
  const [state, setState] = useState<string>();
  const [entityType, setEntityType] = useState<string>();
  const [messageTypes, setMessageTypes] = useState<string[]>([]);
  const [ownershipTypes, setOwnershipTypes] = useState<string[]>([]);
  const [donationPlatform, setDonationPlatform] = useState<string>();
  const [subscriptionsOnly, setSubscriptionsOnly] = useState(false);
  const [tag, setTag] = useState<string>();
  const [picker, setPicker] = useState<'entities' | 'state' | 'tag' | null>(null);

  const createAlert = useMutation({
    mutationFn: (input: CreateAlertInput) => mobileApi.createAlert(input),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['alerts'] }); router.back(); },
    onError: (error) => Alert.alert('Couldn’t create alert', error instanceof Error ? error.message : 'Please try again.'),
  });

  const entityOptions = useMemo<FilterSelectionOption[]>(() => (options.data?.entities || []).map((entity) => ({ value: entity.id, label: entity.name, detail: [titleCase(entity.type), titleCase(entity.party), entity.state].filter(Boolean).join(' · '), isFollowing: entity.isFollowing })), [options.data?.entities]);
  const stateOptions = useMemo<FilterSelectionOption[]>(() => (options.data?.states || []).map((value) => ({ value, label: value })), [options.data?.states]);
  const tagOptions = useMemo<FilterSelectionOption[]>(() => (options.data?.tags || []).map((value) => ({ value: value.value, label: value.label })), [options.data?.tags]);
  const selectedEntityNames = entityIds.map((id) => options.data?.entities.find((entity) => entity.id === id)?.name).filter(Boolean);

  if (!canUseAlerts) return <ContentState mode="empty" title="Paid plan required" message="Real-time CI alerts are available on paid plans." actionLabel="Close" onAction={() => router.back()} />;
  if (options.isLoading) return <ContentState mode="loading" message="Loading alert options…" />;
  if (options.isError || !options.data) return <ContentState mode="error" title="Couldn’t load alert options" message={options.error instanceof Error ? options.error.message : undefined} actionLabel="Try again" onAction={() => void options.refetch()} />;

  const pickerOptions = picker === 'entities' ? entityOptions : picker === 'state' ? stateOptions : tagOptions;
  const pickerValues = picker === 'entities' ? entityIds : picker === 'state' && state ? [state] : picker === 'tag' && tag ? [tag] : [];
  const submit = () => createAlert.mutate({
    name: name.trim(), search: search.trim() || undefined, entityIds, party, state, entityType,
    messageTypes: messageTypes as CreateAlertInput['messageTypes'], ownershipTypes: ownershipTypes as CreateAlertInput['ownershipTypes'],
    donationPlatform, subscriptionsOnly, tag,
  });

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={92}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View><Text style={[styles.title, { color: theme.text }]}>Create a CI alert</Text><Text style={[styles.subtitle, { color: theme.textMuted }]}>Choose what should trigger a push notification. Filters work together, just like the CI feed.</Text></View>

        <View style={styles.section}><Text style={[styles.label, { color: theme.text }]}>Alert name</Text><TextInput accessibilityLabel="Alert name" autoFocus maxLength={80} onChangeText={setName} placeholder="e.g. Missouri fundraising" placeholderTextColor={theme.textMuted} style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={name} /></View>
        <View style={styles.section}><Text style={[styles.label, { color: theme.text }]}>Keyword or phrase</Text><Text style={[styles.helper, { color: theme.textMuted }]}>Optional. Searches the entity, sender, subject, and message preview.</Text><TextInput accessibilityLabel="Alert keyword" autoCapitalize="none" autoCorrect={false} maxLength={100} onChangeText={setSearch} placeholder="e.g. border security" placeholderTextColor={theme.textMuted} returnKeyType="done" style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={search} /></View>

        <SelectionRow icon="people-outline" title="Entities" value={selectedEntityNames.length ? `${selectedEntityNames.length} selected` : 'All entities'} onPress={() => setPicker('entities')} />
        <View style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={styles.toggleText}><Text style={[styles.label, { color: theme.text }]}>Following only</Text><Text style={[styles.helper, { color: theme.textMuted }]}>Only notify for entities your organization follows.</Text></View><Switch accessibilityLabel="Following only" value={subscriptionsOnly} onValueChange={setSubscriptionsOnly} trackColor={{ false: theme.surfaceMuted, true: theme.red }} /></View>

        <SingleChoice title="Party" value={party} options={options.data.parties} onChange={setParty} />
        <SingleChoice title="Entity type" value={entityType} options={options.data.entityTypes} onChange={setEntityType} />
        <SelectionRow icon="map-outline" title="State" value={state || 'All states'} onPress={() => setPicker('state')} />
        <MultiChoice title="Message type" helper="Leave both unselected to receive either type." values={messageTypes} options={options.data.messageTypes} onChange={setMessageTypes} />
        <MultiChoice title="Audience source" helper="Leave both unselected for House File and Third Party." values={ownershipTypes} options={options.data.ownershipTypes} onChange={setOwnershipTypes} />
        <SingleChoice title="Donation platform" value={donationPlatform} options={options.data.donationPlatforms} onChange={setDonationPlatform} />
        {tagOptions.length ? <SelectionRow icon="pricetag-outline" title="Entity tag" value={tag || 'Any tag'} onPress={() => setPicker('tag')} /> : null}

        <View style={[styles.summary, { backgroundColor: `${theme.red}0D`, borderColor: `${theme.red}33` }]}><Ionicons name="information-circle-outline" size={21} color={theme.red} /><Text style={[styles.summaryText, { color: theme.textMuted }]}>{name.trim() ? 'Your alert will begin watching new messages as soon as it is created.' : 'Give your alert a short name to save it.'}</Text></View>
        <PrimaryButton label="Create alert" loading={createAlert.isPending} disabled={!name.trim()} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
    {picker ? <FilterSelectionSheet visible title={picker === 'entities' ? 'Entities' : picker === 'state' ? 'State' : 'Entity tag'} searchPlaceholder={`Search ${picker}`} options={pickerOptions} selectedValues={pickerValues} multiple={picker === 'entities'} onClose={() => setPicker(null)} onApply={(values) => { if (picker === 'entities') setEntityIds(values); else if (picker === 'state') setState(values[0]); else setTag(values[0]); }} /> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1 }, content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }, subtitle: { fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  section: { gap: spacing.sm }, label: { fontSize: 15, fontWeight: '700' }, helper: { fontSize: 13, lineHeight: 18 },
  input: { borderRadius: radii.md, borderWidth: 1, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, choice: { borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg }, choiceText: { fontSize: 14, fontWeight: '600' },
  selectionRow: { alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, minHeight: 72, padding: spacing.md },
  selectionIcon: { alignItems: 'center', borderRadius: radii.md, height: 44, justifyContent: 'center', width: 44 }, selectionText: { flex: 1, gap: 3 }, selectionValue: { fontSize: 13 },
  toggleRow: { alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.lg, justifyContent: 'space-between', padding: spacing.lg }, toggleText: { flex: 1, gap: spacing.xs },
  summary: { alignItems: 'flex-start', borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, summaryText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
