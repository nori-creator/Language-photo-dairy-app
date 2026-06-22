import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { radius, timing, useColors } from '@/theme';

/** Single-accent progress track. Fills with a soft spring-eased timing. */
export function ProgressBar({ progress, style, height = 10 }: { progress: number; style?: StyleProp<ViewStyle>; height?: number }) {
  const colors = useColors();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), timing.soft);
  }, [progress]);

  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.fill }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: colors.blue }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
