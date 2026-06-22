import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radius, shadow, spacing, useColors } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Drop the soft shadow (e.g. when nested or flush). */
  flat?: boolean;
  padded?: boolean;
}

/**
 * Content surface: secondary grouped background, continuous-feel card radius,
 * faint preset shadow. Groups are separated by whitespace, not rules (HIG).
 */
export function Card({ children, style, flat, padded = true }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.secondarySystemGroupedBackground },
        padded && styles.padded,
        !flat && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  padded: { padding: spacing.lg },
});
