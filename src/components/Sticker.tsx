import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { AppText } from './AppText';

interface Props {
  /** Either an emoji standing in for the cut-out subject, or a photo URI. */
  emoji: string;
  size?: number;
  /** 0 = crisp, 1 = nearly gone. Drives the forgetting-blur mechanic. */
  blur?: number;
}

/** A real captured photo vs. an emoji placeholder. */
function isImageUri(value: string): boolean {
  return /^(file:|content:|https?:|data:|ph:|assets-library:)/.test(value);
}

/**
 * The cut-out "sticker". Shows the real captured photo when given a URI, or an
 * emoji placeholder otherwise. When a word is being forgotten (blur > 0) the
 * image progressively fades — loss aversion to push recall.
 */
export function Sticker({ emoji, size = 64, blur = 0 }: Props) {
  const showImage = isImageUri(emoji);
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {showImage ? (
        <Image
          source={{ uri: emoji }}
          style={[styles.image, { width: size, height: size, opacity: 1 - blur * 0.6 }]}
          contentFit="cover"
        />
      ) : (
        <AppText style={{ fontSize: size * 0.72, opacity: 1 - blur * 0.6 }}>{emoji}</AppText>
      )}
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
  image: { borderRadius: 16 },
});
