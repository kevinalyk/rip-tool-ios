import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, useAppTheme } from '@/constants/theme';

export function OfflineBanner() {
  const network = useNetInfo();
  const theme = useAppTheme();
  if (network.isConnected !== false) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.warning }]} accessibilityRole="alert">
      <Text style={styles.text}>You’re offline. Some information may be unavailable.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
