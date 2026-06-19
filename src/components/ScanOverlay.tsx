import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '@/theme';
import { AppText } from './AppText';

interface Props {
  /** Height of the viewfinder the overlay scans across. */
  height?: number;
  label?: string;
}

const SCAN_COLOR = '#34C759'; // iOS green — reads as "scanning"
const CORNER = 26;

/**
 * Sci-fi "the AI is scanning the subject" overlay: a glowing line sweeps the
 * frame while targeting brackets pulse at the corners. Shown while identify()
 * is running over a captured photo.
 */
export function ScanOverlay({ height = 280, label = 'AIが解析中…' }: Props) {
  const lineY = useSharedValue(0);
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    lineY.value = withRepeat(
      withTiming(height - 4, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    pulse.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [height]);

  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lineY.value }] }));
  const cornerStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Targeting brackets */}
      <Animated.View style={[styles.corner, styles.tl, cornerStyle]} />
      <Animated.View style={[styles.corner, styles.tr, cornerStyle]} />
      <Animated.View style={[styles.corner, styles.bl, cornerStyle]} />
      <Animated.View style={[styles.corner, styles.br, cornerStyle]} />

      {/* Sweeping scan line with a soft glow trail */}
      <Animated.View style={[styles.lineWrap, lineStyle]}>
        <LinearGradient
          colors={['rgba(52,199,89,0)', 'rgba(52,199,89,0.35)', 'rgba(52,199,89,0)']}
          style={styles.lineGlow}
        />
        <View style={styles.line} />
      </Animated.View>

      <View style={styles.labelWrap}>
        <AppText variant="footnote" color="#fff">{label}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: SCAN_COLOR,
  },
  tl: { top: spacing.md, left: spacing.md, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: spacing.md, right: spacing.md, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: spacing.md, left: spacing.md, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: spacing.md, right: spacing.md, borderBottomWidth: 3, borderRightWidth: 3 },
  lineWrap: { position: 'absolute', left: 0, right: 0, top: 0, height: 40, justifyContent: 'center' },
  lineGlow: { ...StyleSheet.absoluteFillObject },
  line: { height: 2, backgroundColor: SCAN_COLOR, shadowColor: SCAN_COLOR, shadowOpacity: 0.9, shadowRadius: 6 },
  labelWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
});
