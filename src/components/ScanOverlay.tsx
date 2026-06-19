import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '@/theme';
import { AppText } from './AppText';

interface Props {
  height?: number;
  label?: string;
}

const TINT = '#0A84FF'; // refined systemBlue
const CORNER = 28;

/**
 * Refined "scanning the subject" overlay: a soft laser sweeps the frame, a
 * focus ring settles once, and the corner brackets breathe gently. Calm and
 * precise — no flicker.
 */
export function ScanOverlay({ height = 280, label = '解析中' }: Props) {
  const sweep = useSharedValue(0);
  const breathe = useSharedValue(0);
  const ring = useSharedValue(1.25);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true,
    );
    breathe.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    // Focus ring snaps in once, then holds.
    ringOpacity.value = withSequence(withTiming(1, { duration: 350 }), withDelay(400, withTiming(0.5, { duration: 600 })));
    ring.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [height]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * (height - 48) }],
    opacity: 0.5 + sweep.value * 0.5,
  }));
  const cornerStyle = useAnimatedStyle(() => ({ opacity: 0.45 + breathe.value * 0.45 }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ring.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Subtle vignette so the subject pops */}
      <LinearGradient
        colors={['rgba(0,0,0,0.28)', 'transparent', 'transparent', 'rgba(0,0,0,0.28)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Focus ring that settles once */}
      <View style={styles.center} pointerEvents="none">
        <Animated.View style={[styles.ring, ringStyle]} />
      </View>

      {/* Breathing corner brackets */}
      <Animated.View style={[styles.corner, styles.tl, cornerStyle]} />
      <Animated.View style={[styles.corner, styles.tr, cornerStyle]} />
      <Animated.View style={[styles.corner, styles.bl, cornerStyle]} />
      <Animated.View style={[styles.corner, styles.br, cornerStyle]} />

      {/* Soft laser sweep */}
      <Animated.View style={[styles.laserWrap, laserStyle]}>
        <LinearGradient
          colors={['rgba(10,132,255,0)', 'rgba(10,132,255,0.28)', 'rgba(10,132,255,0)']}
          style={styles.laserGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.laserLine} />
      </Animated.View>

      {/* Quiet status pill */}
      <View style={styles.labelWrap}>
        <BlurView intensity={28} tint="dark" style={styles.pill}>
          <View style={styles.dot} />
          <AppText variant="footnote" color="#fff">{label}</AppText>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 150,
    height: 150,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: TINT },
  tl: { top: spacing.lg, left: spacing.lg, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  tr: { top: spacing.lg, right: spacing.lg, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bl: { bottom: spacing.lg, left: spacing.lg, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  br: { bottom: spacing.lg, right: spacing.lg, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  laserWrap: { position: 'absolute', left: 0, right: 0, top: 0, height: 48, justifyContent: 'center' },
  laserGlow: { ...StyleSheet.absoluteFillObject },
  laserLine: {
    height: 1.5,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: TINT,
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  labelWrap: { position: 'absolute', bottom: spacing.lg, alignSelf: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: TINT },
});
