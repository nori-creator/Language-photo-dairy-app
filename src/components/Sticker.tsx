import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { AppText } from './AppText';

interface Props {
  /** Emoji standing in for the cut-out subject. */
  emoji: string;
  size?: number;
  /** 0 = crisp, 1 = nearly gone. Drives the forgetting-blur mechanic. */
  blur?: number;
}

/**
 * The cut-out "sticker". When a word is being forgotten (blur > 0) the photo
 * progressively fades — loss aversion to push recall.
 */
export function Sticker({ emoji, size = 64, blur = 0 }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <AppText style={{ fontSize: size * 0.72, opacity: 1 - blur * 0.6 }}>{emoji}</AppText>
      {blur > 0 && (
        <BlurView
          intensity={Math.round(blur * 40)}
          tint="default"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
