import React, { useEffect } from 'react';
import { ImageBackground, Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { radius, spacing, spring, timing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { feedback } from '@/lib/feedback';
import { services } from '@/services';
import { LanguageCode } from '@/types';
import { AppText } from './AppText';
import { Icon, PressableScale } from './ui';
import { CutoutSticker } from './CutoutSticker';

interface Props {
  visible: boolean;
  photo: string;
  sticker?: string | null;
  word: string;
  reading?: string;
  target?: LanguageCode;
  onDone: () => void;
}

// Sparkle positions around the sticker (relative to centre).
const SPARKS = [
  { x: -96, y: -54, s: 6 }, { x: 84, y: -88, s: 5 }, { x: 104, y: 14, s: 7 },
  { x: -104, y: 36, s: 5 }, { x: 60, y: 104, s: 6 }, { x: -64, y: 112, s: 4 },
  { x: 6, y: -128, s: 5 }, { x: 120, y: 70, s: 4 },
];

function Sparkle({ x, y, s, i, t }: { x: number; y: number; s: number; i: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const v = (t.value + i * 0.17) % 1;
    const o = Math.sin(v * Math.PI);
    return { opacity: 0.15 + o * 0.85, transform: [{ scale: 0.5 + o * 0.7 }] };
  });
  return <Animated.View style={[styles.spark, { width: s, height: s, borderRadius: s / 2, left: '50%', top: '50%', marginLeft: x, marginTop: y }, style]} />;
}

/**
 * The reward moment, CapWords-style: on bright dotted paper, a warm glow blooms
 * with twinkling sparkles, the cut-out sticker pops in, the word + reading rise,
 * and the Taiwan pronunciation auto-plays. Refined — no dark scrim, no clutter.
 */
export function StickerRevealOverlay({ visible, photo, sticker, word, reading, target = 'zh-TW', onDone }: Props) {
  const colors = useColors();
  const reduced = useReducedMotion();

  const fade = useSharedValue(0);
  const pop = useSharedValue(reduced ? 1 : 0.6);
  const glow = useSharedValue(reduced ? 1 : 0.3);
  const label = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    fade.value = withTiming(1, timing.standard);

    if (reduced) {
      label.value = withTiming(1, timing.standard);
      feedback.success();
    } else {
      glow.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
      pop.value = withDelay(80, withSpring(1, spring.bouncy));
      label.value = withDelay(260, withTiming(1, timing.standard));
      twinkle.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false);
      timers.push(setTimeout(() => feedback.success(), 120));
    }
    // Auto-play the native pronunciation as the reward lands.
    timers.push(setTimeout(() => services.tts.speak({ text: word, target }).catch(() => {}), 360));
    // Dismiss.
    timers.push(setTimeout(() => (fade.value = withTiming(0, timing.standard)), 2000));
    timers.push(setTimeout(onDone, 2340));
    return () => timers.forEach(clearTimeout);
  }, [visible, reduced]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.7 + glow.value * 0.5 }] }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: label.value, transform: [{ translateY: (1 - label.value) * 14 }] }));

  if (!visible) return null;

  const replay = () => {
    feedback.tap();
    services.tts.speak({ text: word, target }).catch(() => {});
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View style={[styles.scrim, { backgroundColor: colors.systemBackground }, fadeStyle]}>
        <ImageBackground source={require('../../assets/dot-tile.png')} resizeMode="repeat" style={StyleSheet.absoluteFill} />

        <View style={styles.center}>
          <View style={styles.stageWrap}>
            <Animated.Image source={require('../../assets/glow.png')} style={[styles.glow, glowStyle]} />
            {!reduced && SPARKS.map((sp, i) => (
              <Sparkle key={i} {...sp} i={i} t={twinkle} />
            ))}
            <Animated.View style={popStyle}>
              <CutoutSticker uri={sticker || photo} size={220} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.label, labelStyle]}>
            <View style={styles.wordRow}>
              <AppText variant="title1" color={colors.label} style={styles.word}>{word}</AppText>
              <PressableScale onPress={replay} haptic={false} style={styles.speaker}>
                <Icon name="volume-high" size={18} color="#fff" />
              </PressableScale>
            </View>
            {!!reading && <AppText variant="headline" color={colors.secondaryLabel}>{reading}</AppText>}
            <AppText variant="subhead" color={colors.tertiaryLabel} style={{ marginTop: spacing.sm }}>
              コレクションに追加
            </AppText>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const GLOW = 300;
const styles = StyleSheet.create({
  scrim: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stageWrap: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: GLOW, height: GLOW },
  spark: { position: 'absolute', backgroundColor: '#FFC95C' },
  label: { alignItems: 'center', marginTop: spacing.xl, gap: 2 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  word: { fontWeight: '800' as const },
  speaker: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0A84FF', alignItems: 'center', justifyContent: 'center' },
});
