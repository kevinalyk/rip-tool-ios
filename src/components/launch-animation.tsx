import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/constants/theme';

type LaunchAnimationProps = {
  onFinish: () => void;
};

const MARK_WIDTH = 190;
const MARK_HEIGHT = 247;
const IMPACT_DELAY_MS = 610;

export function LaunchAnimation({ onFinish }: LaunchAnimationProps) {
  const theme = useAppTheme();
  const { height } = useWindowDimensions();
  const arrowDrop = useSharedValue(-Math.max(height * 0.58, 390));
  const impactOffset = useSharedValue(0);
  const wordDrop = useSharedValue(-48);
  const gopColor = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    let mounted = true;
    let reducedMotionTimer: ReturnType<typeof setTimeout> | undefined;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;

      if (reduceMotion) {
        arrowDrop.value = 0;
        wordDrop.value = 0;
        gopColor.value = 1;
        reducedMotionTimer = setTimeout(onFinish, 550);
        return;
      }

      arrowDrop.value = withDelay(
        80,
        withTiming(0, {
          duration: 530,
          easing: Easing.bezier(0.3, 0, 0.85, 0.58),
        }),
      );

      impactOffset.value = withDelay(
        IMPACT_DELAY_MS,
        withSequence(
          withTiming(27, { duration: 95, easing: Easing.out(Easing.quad) }),
          withSpring(-9, { damping: 10, stiffness: 260, mass: 0.55 }),
          withSpring(0, { damping: 13, stiffness: 220, mass: 0.5 }),
        ),
      );

      wordDrop.value = withDelay(
        750,
        withSpring(0, { damping: 10, stiffness: 145, mass: 0.72 }),
      );

      gopColor.value = withDelay(
        1270,
        withTiming(1, { duration: 190, easing: Easing.out(Easing.cubic) }),
      );

      overlayOpacity.value = withDelay(
        1700,
        withTiming(0, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onFinish)();
        }),
      );
    });

    return () => {
      mounted = false;
      if (reducedMotionTimer) clearTimeout(reducedMotionTimer);
    };
  }, [arrowDrop, gopColor, impactOffset, onFinish, overlayOpacity, wordDrop]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
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
      style={[styles.overlay, { backgroundColor: theme.background }, overlayStyle]}>
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
