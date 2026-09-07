import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radii, useAppTheme } from '@/constants/theme';

type EntityAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: number;
};

export function EntityAvatar({ name, imageUrl, size = 44 }: EntityAvatarProps) {
  const theme = useAppTheme();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl && failedImageUrl !== imageUrl) {
    return (
      <View style={[styles.imageFrame, style, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Image
          accessibilityLabel={`${name} profile picture`}
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setFailedImageUrl(imageUrl)}
          source={{ uri: imageUrl }}
          style={style}
          transition={180}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, style, { backgroundColor: theme.surfaceMuted }]}>
      <Text style={[styles.initials, { color: theme.navy, fontSize: size * 0.34 }]}>{name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageFrame: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
  },
});
