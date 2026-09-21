import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/constants/theme';

type LaunchAnimationProps = {
  onFinish: () => void;
};

const MARK_WIDTH = 190;
const MARK_HEIGHT = 247;
const ARROW_DROP_MS = 520;
const IMPACT_DELAY_MS = 500;
const WORD_DROP_DELAY_MS = 720;
const GOP_COLOR_DELAY_MS = 1080;
const ANIMATION_COMPLETE_MS = 1480;
const REDUCED_MOTION_HOLD_MS = 550;

export function LaunchAnimation({ onFinish }: LaunchAnimationProps) {
  const theme = useAppTheme();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const arrowDrop = useSharedValue(reduceMotion ? 0 : -Math.max(height * 0.58, 390));
  const impactOffset = useSharedValue(0);
  const wordDrop = useSharedValue(reduceMotion ? 0 : -48);
  const gopColor = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    let completionTimer: ReturnType<typeof setTimeout> | undefined;

    if (reduceMotion) {
      completionTimer = setTimeout(onFinish, REDUCED_MOTION_HOLD_MS);
      return () => clearTimeout(completionTimer);
    }

    arrowDrop.value = withTiming(0, {
      duration: ARROW_DROP_MS,
      easing: Easing.bezier(0.3, 0, 0.85, 0.58),
    });

    impactOffset.value = withDelay(
      IMPACT_DELAY_MS,
      withSequence(
        withTiming(24, { duration: 75, easing: Easing.out(Easing.quad) }),
        withTiming(-5, { duration: 95, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 140, easing: Easing.out(Easing.cubic) }),
      ),
    );

    wordDrop.value = withDelay(
      WORD_DROP_DELAY_MS,
      withTiming(0, { duration: 310, easing: Easing.out(Easing.cubic) }),
    );

    gopColor.value = withDelay(
      GOP_COLOR_DELAY_MS,
      withTiming(1, { duration: 190, easing: Easing.out(Easing.cubic) }),
    );

    // The parent keeps this exact component mounted during authentication so
    // the settled artwork never jumps, compresses, or flashes before Face ID.
    completionTimer = setTimeout(onFinish, ANIMATION_COMPLETE_MS);

    return () => {
      if (completionTimer) clearTimeout(completionTimer);
    };
  }, [arrowDrop, gopColor, impactOffset, onFinish, reduceMotion, wordDrop]);

  const envelopeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: impactOffset.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowDrop.value + impactOffset.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wordDrop.value }],
  }));
  const gopStyle = useAnimatedStyle(() => ({
    color: interpolateColor(gopColor.value, [0, 1], [theme.navy, theme.red]),
  }));

  return (
    <Animated.View
      accessibilityLabel="Inbox.GOP"
      accessibilityRole="image"
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: theme.background }]}>
      <StatusBar hidden />
      <View style={styles.stage}>
        <Animated.View style={[styles.markLayer, envelopeStyle]}>
          <Image
            contentFit="contain"
            source={require('@/assets/images/inbox-gop-envelope-layer.png')}
            style={styles.markImage}
          />
        </Animated.View>

        <Animated.View style={[styles.markLayer, styles.arrowLayer, arrowStyle]}>
          <Image
            contentFit="contain"
            source={require('@/assets/images/inbox-gop-arrow-layer.png')}
            style={styles.markImage}
          />
        </Animated.View>

        <View style={styles.wordReveal}>
          <Animated.View style={[styles.wordmark, wordStyle]}>
            <Text style={[styles.wordmarkText, { color: theme.navy }]}>Inbox</Text>
            <Animated.Text style={[styles.wordmarkText, gopStyle]}>.GOP</Animated.Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

export function LaunchHoldingScreen() {
  const theme = useAppTheme();

  return (
    <View
      accessibilityLabel="Preparing Inbox.GOP"
      accessibilityRole="image"
      style={[styles.overlay, { backgroundColor: theme.background }]}>
      <StatusBar hidden />
      <View style={styles.stage}>
        <View style={styles.markLayer}>
          <Image
            contentFit="contain"
            source={require('@/assets/images/inbox-gop-envelope-layer.png')}
            style={styles.markImage}
          />
        </View>
        <View style={[styles.markLayer, styles.arrowLayer]}>
          <Image
            contentFit="contain"
            source={require('@/assets/images/inbox-gop-arrow-layer.png')}
            style={styles.markImage}
          />
        </View>
        <View style={styles.wordReveal}>
          <View style={styles.wordmark}>
            <Text style={[styles.wordmarkText, { color: theme.navy }]}>Inbox</Text>
            <Text style={[styles.wordmarkText, { color: theme.red }]}>.GOP</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  stage: {
    height: 316,
    width: 250,
  },
  markLayer: {
    alignSelf: 'center',
    height: MARK_HEIGHT,
    position: 'absolute',
    top: 0,
    width: MARK_WIDTH,
    zIndex: 3,
  },
  arrowLayer: {
    zIndex: 4,
  },
  markImage: {
    height: '100%',
    width: '100%',
  },
  wordReveal: {
    alignItems: 'center',
    bottom: 20,
    height: 58,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  wordmark: {
    flexDirection: 'row',
  },
  wordmarkText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 42,
  },
});
