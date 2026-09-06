import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/constants/branding';
import { spacing, useAppTheme } from '@/constants/theme';

type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  const theme = useAppTheme();
  const markSize = compact ? 34 : 78;

  return (
    <View style={[styles.container, compact && styles.compact]} accessible accessibilityLabel={PRODUCT_NAME}>
      <Image source={require('@/assets/images/inbox-gop-mark.png')} style={{ width: markSize, height: markSize }} contentFit="contain" />
      <View>
        <Text style={[styles.name, compact && styles.compactName, { color: theme.text }]}>Inbox<Text style={{ color: theme.red }}>.GOP</Text></Text>
        {!compact && <Text style={[styles.tagline, { color: theme.blue }]}>{PRODUCT_TAGLINE}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  compact: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  compactName: {
    fontSize: 19,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 3,
    textAlign: 'center',
  },
});
