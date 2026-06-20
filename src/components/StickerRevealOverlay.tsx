import React, { useEffect } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { radius, shadow, spacing, spring, timing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { feedback } from '@/lib/feedback';
import { AppText } from './AppText';

interface Props {
  visible: boolean;
  /** Captured photo URI (the "before"). */
  photo: string;
  /** Cut-out sticker (transparent PNG) if ready; falls back to the photo. */
  sticker?: string | null;
  word: string;
  reading?: string;
  onDone: () => void;
}

const FRAME = 240;

/**
 * The reward performance: the captured photo lifts off its background, crisps
 * into a cut-out sticker, then settles onto a forming collection card — with
 * sound + haptic + visual in sync. Restrained (single accent, one ring pulse),
 * never confetti. Hides the brief enrich/upload wait behind the motion.
 */
export function StickerRevealOverlay({ visible, photo, sticker, word, reading, onDone }: Props) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const hasCutout = !!sticker && sticker !== photo && /^(file:|content:|https?:|data:)/.test(sticker);

  const intro = useSharedValue(0.82);
  const lift = useSharedValue(0);
  const toCard = useSharedValue(0);
  const ring = useSharedValue(0);
  const label = useSharedValue(0);
  const flash = useSharedValue(0);
  const out = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (reduced) {
      intro.value = 1;
      toCard.value = withTiming(1, timing.standard);
      label.value = withDelay(120, withTiming(1, timing.standard));
      feedback.success();
      timers.push(setTimeout(() => (out.value = withTiming(0, timing.standard)), 1200));
      timers.push(setTimeout(onDone, 1560));
      return () => timers.forEach(clearTimeout);
    }

    // 1) Photo eases in.
    intro.value = withSpring(1, spring.soft);
    // 2) Lift off the background.
    lift.value = withDelay(160, withTiming(1, timing.standard));
    timers.push(setTimeout(() => feedback.lift(), 180));
    // 3) Settle onto the forming card + a screen-filling accent flash, an
    //    expanding ring, and the label rising in.
    toCard.value = withDelay(620, withSpring(1, spring.bouncy));
    ring.value = withDelay(620, withSequence(withTiming(1, timing.micro), withTiming(0, timing.soft)));
    flash.value = withDelay(620, withSequence(withTiming(1, { duration: 150 }), withTiming(0, timing.soft)));
    label.value = withDelay(780, withSpring(1, spring.soft));
    timers.push(setTimeout(() => feedback.success(), 640));
    // 4) Dismiss.
    timers.push(setTimeout(() => (out.value = withTiming(0, timing.standard)), 1700));
    timers.push(setTimeout(onDone, 2040));

    return () => timers.forEach(clearTimeout);
  }, [visible, reduced]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: out.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: toCard.value,
    transform: [{ scale: 0.9 + toCard.value * 0.1 }],
  }));
  const subjectStyle = useAnimatedStyle(() => {
    const s = intro.value * (1 + lift.value * 0.06) * (1 - toCard.value * 0.32);
    return {
      transform: [
        { translateY: -lift.value * 8 + toCard.value * -8 },
        { scale: s },
      ],
    };
  });
  const subjectRadius = useAnimatedStyle(() => ({ borderRadius: 12 + lift.value * 16 }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: lift.value * (hasCutout ? 0.6 : 0.25) }));
  const cutoutStyle = useAnimatedStyle(() => ({ opacity: lift.value }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value * 0.85, transform: [{ scale: 1 + ring.value * 0.9 }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.22 }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: label.value, transform: [{ translateY: (1 - label.value) * 16 }] }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Screen-filling accent flash at the reward beat */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.blue }, flashStyle]} pointerEvents="none" />

        {/* Centered stage */}
        <View style={[styles.stage, { width: Math.min(width - 48, 340) }]}>
          {/* Forming collection card (background panel) */}
          <Animated.View style={[styles.card, { backgroundColor: colors.secondarySystemGroupedBackground }, shadow.modal, cardStyle]} />

          {/* Subject: photo that lifts, then crisps into a sticker */}
          <View style={styles.frame} pointerEvents="none">
            <Animated.View style={[styles.ring, { borderColor: colors.blue }, ringStyle]} />
            <Animated.View style={[styles.subject, subjectStyle]}>
              <Animated.View style={[styles.imgClip, subjectRadius]}>
                <Image source={{ uri: photo }} style={styles.img} contentFit="cover" />
                <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} pointerEvents="none" />
                {hasCutout && (
                  <Animated.View style={[StyleSheet.absoluteFill, cutoutStyle]}>
                    <Image source={{ uri: sticker! }} style={styles.img} contentFit="contain" />
                  </Animated.View>
                )}
              </Animated.View>
            </Animated.View>
          </View>

          {/* Word label */}
          <Animated.View style={[styles.label, labelStyle]}>
            <AppText variant="title1" color="#fff">{word}</AppText>
            {!!reading && <AppText variant="headline" color="rgba(255,255,255,0.7)">{reading}</AppText>}
            <AppText variant="subhead" color="rgba(255,255,255,0.7)" style={{ marginTop: spacing.xs }}>
              コレクションに追加
            </AppText>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  stage: { alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', top: -24, bottom: -24, left: -4, right: -4, borderRadius: radius.xxl },
  frame: { width: FRAME, height: FRAME, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', top: -12, left: -12, width: FRAME + 24, height: FRAME + 24, borderRadius: radius.xxl, borderWidth: 2 },
  subject: { width: FRAME, height: FRAME, alignItems: 'center', justifyContent: 'center' },
  imgClip: { width: FRAME, height: FRAME, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  dim: { backgroundColor: 'rgba(0,0,0,1)' },
  label: { marginTop: spacing.xxl, alignItems: 'center', gap: 2 },
});
