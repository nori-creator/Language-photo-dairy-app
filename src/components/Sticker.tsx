import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/theme';

interface Props {
  /** A photo URI for the cut-out subject (or a stray emoji from legacy data). */
  emoji: string;
  size?: number;
  /** 0 = crisp, 1 = nearly gone. Drives the forgetting-blur mechanic. */
  blur?: number;
}

/** A real captured photo vs. a placeholder. */
function isImageUri(value: string): boolean {
  return /^(file:|content:|https?:|data:|ph:|assets-library:)/.test(value);
}

/**
 * The cut-out "sticker": the real captured photo when given a URI, otherwise a
 * neutral monochrome placeholder (no decorative emoji). When a word is being
 * forgotten (blur > 0) the image progressively fades — loss aversion to recall.
 */
export function Sticker({ emoji, size = 64, blur = 0 }: Props) {
  const colors = useColors();
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
        <Ionicons name="image-outline" size={size * 0.5} color={colors.tertiaryLabel} style={{ opacity: 1 - blur * 0.6 }} />
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
