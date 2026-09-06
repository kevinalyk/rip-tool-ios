import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { radii, spacing, useAppTheme } from '@/constants/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  accessibilityHint,
}: PrimaryButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === 'primary' ? theme.red : variant === 'danger' ? theme.danger : theme.surfaceMuted;
  const foregroundColor = variant === 'secondary' ? theme.text : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: isDisabled ? 0.5 : pressed ? 0.78 : 1 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={foregroundColor} /> : <Text style={[styles.label, { color: foregroundColor }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
