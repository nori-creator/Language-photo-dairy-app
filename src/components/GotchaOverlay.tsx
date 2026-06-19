import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { Sticker } from './Sticker';

interface Props {
  visible: boolean;
  emoji: string;
  word: string;
  onDone: () => void;
}

/**
 * Pokémon-style "GOTCHA!" celebration shown when a new card is collected:
 * a burst of light, the sticker springs in and flips into the dex.
 */
export function GotchaOverlay({ visible, emoji, word, onDone }: Props) {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);
  const labelY = useSharedValue(20);

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    glow.value = withSequence(withTiming(1, { duration: 350 }), withTiming(0.4, { duration: 600 }));
    scale.value = withSpring(1, { damping: 9, stiffness: 120 });
    labelY.value = withDelay(250, withSpring(0));
    const t = setTimeout(() => {
      scale.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
      glow.value = withTiming(0, { duration: 250 });
      setTimeout(onDone, 260);
    }, 1500);
    return () => clearTimeout(t);
  }, [visible]);

  const stickerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${(1 - scale.value) * 90}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ translateY: labelY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <LinearGradient
            colors={['#FFD60A', '#FF9500', '#FF2D55']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
        <Animated.View style={stickerStyle}>
          <Sticker emoji={emoji} size={160} />
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  labelWrap: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs },
});
