import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { Sticker } from './Sticker';

interface Props {
  visible: boolean;
  emoji: string;
  word: string;
  onDone: () => void;
}

const PARTICLE_COUNT = 14;
const PARTICLE_COLORS = ['#FFD60A', '#FF9500', '#FF2D55', '#5AC8FA', '#34C759'];

/** A single spark that bursts outward from the card. */
function Particle({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 120 + (index % 3) * 28;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 0.6 + progress.value * 0.8 },
    ],
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

/**
 * "New character unlocked!" celebration shown when a card is collected:
 * rotating light rays burst out, sparks fly, the card springs and flips in,
 * and a NEW! badge pops — like catching a creature in a game.
 */
export function GotchaOverlay({ visible, emoji, word, onDone }: Props) {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);
  const rays = useSharedValue(0);
  const burst = useSharedValue(0);
  const labelY = useSharedValue(24);
  const badge = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    glow.value = withSequence(withTiming(1, { duration: 300 }), withTiming(0.5, { duration: 700 }));
    rays.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
    burst.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withSpring(1.15, { damping: 7, stiffness: 130 }),
      withSpring(1, { damping: 12, stiffness: 120 }),
    );
    labelY.value = withDelay(250, withSpring(0, { damping: 11 }));
    badge.value = withDelay(450, withSpring(1, { damping: 6, stiffness: 180 }));

    const t = setTimeout(() => {
      scale.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
      glow.value = withTiming(0, { duration: 250 });
      badge.value = withTiming(0, { duration: 200 });
      setTimeout(onDone, 260);
    }, 2100);
    return () => clearTimeout(t);
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.8,
    transform: [{ rotate: `${rays.value * 360}deg` }, { scale: 1.4 }],
  }));
  const stickerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${(1 - scale.value) * 90}deg` }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ translateY: labelY.value }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badge.value,
    transform: [{ scale: badge.value }, { rotate: '-12deg' }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        {/* Color wash */}
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <LinearGradient
            colors={['#FFD60A', '#FF9500', '#FF2D55']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* Rotating sunburst rays */}
        <Animated.View style={[styles.rays, raysStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
            style={styles.rayBeam}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
            style={[styles.rayBeam, { transform: [{ rotate: '60deg' }] }]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
            style={[styles.rayBeam, { transform: [{ rotate: '120deg' }] }]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* Bursting sparks */}
        <View style={styles.burstAnchor} pointerEvents="none">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <Particle key={i} index={i} progress={burst} />
          ))}
        </View>

        {/* The captured card */}
        <Animated.View style={stickerStyle}>
          <Sticker emoji={emoji} size={160} />
          <Animated.View style={[styles.badge, badgeStyle]}>
            <AppText variant="caption1" color="#fff">NEW!</AppText>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <AppText variant="largeTitle" color="#fff">ゲット！</AppText>
          <AppText variant="title3" color="#fff">{word}</AppText>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  rays: { position: 'absolute', width: 360, height: 360, alignItems: 'center', justifyContent: 'center' },
  rayBeam: { position: 'absolute', width: 60, height: 360, borderRadius: 30 },
  burstAnchor: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF2D55',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: '#fff',
  },
  labelWrap: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs },
});
