import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HIT_TARGET, radius, spacing, useColors } from '@/theme';
import { AppText } from './AppText';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'tinted' | 'plain';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** iOS-style button (filled / tinted / plain) with haptic feedback. */
export function PrimaryButton({ title, onPress, variant = 'filled', loading, disabled, style }: Props) {
  const colors = useColors();
  const isFilled = variant === 'filled';
  const isTinted = variant === 'tinted';

  const handle = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isFilled && { backgroundColor: colors.blue },
        isTinted && { backgroundColor: colors.fill },
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HIT_TARGET + 6,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
});
