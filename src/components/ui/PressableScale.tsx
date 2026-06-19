import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PRESS_OPACITY, PRESS_SCALE, spring } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Light haptic on press-in. Default true. */
  haptic?: boolean;
  disabled?: boolean;
}

/**
 * The one tap interaction for the whole app: scale to 0.96 with a spring and a
 * light haptic, settle back on release. Reduce Motion is honored automatically
 * through the spring config. Use everywhere instead of bare Pressable.
 */
export function PressableScale({ children, style, haptic = true, disabled, onPress, ...rest }: Props) {
  const p = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - p.value * (1 - PRESS_SCALE), spring.snappy) }],
    opacity: withTiming(disabled ? 0.4 : 1 - p.value * (1 - PRESS_OPACITY), { duration: 90 }),
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        p.value = 1;
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        p.value = 0;
        rest.onPressOut?.(e);
      }}
      onPress={onPress}
      style={[animated, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
