import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing, useAppTheme } from '@/constants/theme';
import { PrimaryButton } from '@/components/primary-button';

type ContentStateProps = {
  mode: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ContentState({ mode, title, message, actionLabel, onAction }: ContentStateProps) {
  const theme = useAppTheme();

  if (mode === 'loading') {
    return (
      <View style={styles.container} accessibilityRole="progressbar">
        <ActivityIndicator size="large" color={theme.red} />
        <Text style={[styles.message, { color: theme.textMuted }]}>{message || 'Loading…'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name={mode === 'error' ? 'cloud-offline-outline' : 'file-tray-outline'}
        size={40}
        color={theme.textMuted}
      />
      <Text style={[styles.title, { color: theme.text }]}>{title || (mode === 'error' ? 'Something went wrong' : 'Nothing here yet')}</Text>
      {message ? <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
    minWidth: 140,
  },
});
