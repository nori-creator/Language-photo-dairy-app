import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { HIT_TARGET, PRESS_OPACITY, PRESS_SCALE, radius, shadow, spacing, spring, useColors } from '@/theme';
import { AppText } from './AppText';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'tinted' | 'plain';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** iOS-style button (filled / tinted / plain) with a spring press and haptics. */
export function PrimaryButton({ title, onPress, variant = 'filled', loading, disabled, style }: Props) {
  const colors = useColors();
  const isFilled = variant === 'filled';
  const isTinted = variant === 'tinted';
  const isPlain = variant === 'plain';

  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * (1 - PRESS_SCALE), spring.snappy) }],
    opacity: withTiming(disabled ? 0.4 : 1 - pressed.value * (1 - PRESS_OPACITY), { duration: 90 }),
  }));

  const handle = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handle}
      disabled={disabled || loading}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      style={[
        styles.base,
        isFilled && [{ backgroundColor: colors.blue }, shadow.sm],
        isTinted && { backgroundColor: colors.fill },
        isPlain && styles.plain,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? '#fff' : colors.blue} />
      ) : (
        <AppText variant="headline" color={isFilled ? '#FFFFFF' : colors.blue}>
          {title}
        </AppText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HIT_TARGET + 6,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  plain: { minHeight: HIT_TARGET, paddingHorizontal: spacing.md },
});
