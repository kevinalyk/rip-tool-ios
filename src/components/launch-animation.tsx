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
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/constants/theme';

type LaunchAnimationProps = {
  onFinish: () => void;
};

const MARK_WIDTH = 190;
const MARK_HEIGHT = 247;
// iOS spends roughly half a second animating from the Home Screen into the app.
// Hold the initial envelope-only frame until that system transition is visible;
// otherwise the branded sequence runs behind it and users only see the final mark.
const IOS_APP_OPEN_TRANSITION_MS = 650;
const IMPACT_DELAY_MS = 610;
const ANIMATION_COMPLETE_MS = IOS_APP_OPEN_TRANSITION_MS + 1920;
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

    arrowDrop.value = withDelay(
      IOS_APP_OPEN_TRANSITION_MS + 80,
      withTiming(0, {
        duration: 530,
        easing: Easing.bezier(0.3, 0, 0.85, 0.58),
      }),
    );

    impactOffset.value = withDelay(
      IOS_APP_OPEN_TRANSITION_MS + IMPACT_DELAY_MS,
      withSequence(
        withTiming(27, { duration: 95, easing: Easing.out(Easing.quad) }),
        withSpring(-9, { damping: 10, stiffness: 260, mass: 0.55 }),
        withSpring(0, { damping: 13, stiffness: 220, mass: 0.5 }),
      ),
    );

    wordDrop.value = withDelay(
      IOS_APP_OPEN_TRANSITION_MS + 750,
      withSpring(0, { damping: 10, stiffness: 145, mass: 0.72 }),
    );

    gopColor.value = withDelay(
      IOS_APP_OPEN_TRANSITION_MS + 1270,
      withTiming(1, { duration: 190, easing: Easing.out(Easing.cubic) }),
    );

    // Keep the completed logo fully visible. The next authentication-loading
    // frame renders the identical artwork, avoiding a black flash or a second
    // logo appearance while the native Face ID prompt is presented.
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
