import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { radii, useAppTheme } from '@/constants/theme';

type EntityAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: number;
};

export function EntityAvatar({ name, imageUrl, size = 44 }: EntityAvatarProps) {
  const theme = useAppTheme();
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={style} contentFit="cover" transition={150} accessibilityLabel={`${name} logo`} />;
  }

  return (
    <View style={[styles.fallback, style, { backgroundColor: theme.surfaceMuted }]}>
      <Text style={[styles.initials, { color: theme.navy, fontSize: size * 0.34 }]}>{name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
  },
});
