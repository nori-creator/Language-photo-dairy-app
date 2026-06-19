import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
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
const SWEEP = 64; // height of the laser band

/**
 * "Scanning the subject" overlay: a glowing laser sweeps top→bottom on a loop
 * like a real scanner, a focus ring settles once, the corner brackets breathe,
 * and a live pulsing dot + animated ellipsis make the analysis feel alive.
 */
export function ScanOverlay({ height = 280, label = '解析中' }: Props) {
  const sweep = useSharedValue(0);
  const breathe = useSharedValue(0);
  const ring = useSharedValue(1.25);
  const ringOpacity = useSharedValue(0);
  const dot = useSharedValue(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Continuous downward scan (snaps back to the top each pass).
    sweep.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, false);
    breathe.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    dot.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true);
    // Focus ring snaps in once, then holds.
    ringOpacity.value = withSequence(withTiming(1, { duration: 350 }), withDelay(400, withTiming(0.5, { duration: 600 })));
    ring.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [height]);

  // Animated "…" so the label reads as active processing.
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '・')), 350);
    return () => clearInterval(id);
  }, []);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * (height - SWEEP) }],
    // Fade in as it leaves the top, fade out as it reaches the bottom.
    opacity: interpolate(sweep.value, [0, 0.12, 0.88, 1], [0, 1, 1, 0]),
  }));
  const cornerStyle = useAnimatedStyle(() => ({ opacity: 0.45 + breathe.value * 0.45 }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ring.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + dot.value * 0.6,
    transform: [{ scale: 0.8 + dot.value * 0.5 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Subtle vignette so the subject pops */}
      <LinearGradient
        colors={['rgba(0,0,0,0.32)', 'transparent', 'transparent', 'rgba(0,0,0,0.32)']}
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

      {/* Glowing laser sweep with a trailing gradient */}
      <Animated.View style={[styles.laserWrap, { height: SWEEP }, laserStyle]}>
        <LinearGradient
          colors={['rgba(10,132,255,0)', 'rgba(10,132,255,0.30)']}
          style={styles.laserGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.laserLine} />
      </Animated.View>

      {/* Live status pill */}
      <View style={styles.labelWrap}>
        <BlurView intensity={28} tint="dark" style={styles.pill}>
          <Animated.View style={[styles.dot, dotStyle]} />
          <AppText variant="footnote" color="#fff">{label}{dots}</AppText>
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
  tl: { top: spacing.xl, left: spacing.xl, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  tr: { top: spacing.xl, right: spacing.xl, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bl: { bottom: spacing.xl, left: spacing.xl, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  br: { bottom: spacing.xl, right: spacing.xl, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  laserWrap: { position: 'absolute', left: 0, right: 0, top: 0, justifyContent: 'flex-end' },
  laserGlow: { ...StyleSheet.absoluteFillObject },
  laserLine: {
    height: 2,
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: TINT,
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  labelWrap: { position: 'absolute', bottom: spacing.xxl, alignSelf: 'center' },
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
