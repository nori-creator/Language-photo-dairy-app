import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Sticker } from './Sticker';

interface Props {
  /** Cut-out (transparent PNG) URI, or a plain emoji/placeholder string. */
  uri: string;
  size?: number;
  /** 0 = crisp, 1 = nearly gone (forgetting blur). */
  blur?: number;
}

function isImageUri(value: string): boolean {
  return /^(file:|content:|https?:|data:|ph:|assets-library:)/.test(value);
}

/**
 * CapWords-style sticker: a background-removed cut-out with a soft white edge
 * (sticker stroke) and a silhouette drop shadow, so it reads as "pasted" on
 * paper. Falls back to the neutral Sticker for non-image values.
 */
export function CutoutSticker({ uri, size = 140, blur = 0 }: Props) {
  if (!isImageUri(uri)) return <Sticker emoji={uri} size={size} blur={blur} />;
  const opacity = 1 - blur * 0.6;
  return (
    <View style={{ width: size, height: size }}>
      {/* silhouette shadow */}
      <Image
        source={{ uri }}
        contentFit="contain"
        tintColor="rgba(0,0,0,0.22)"
        blurRadius={6}
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: size * 0.03 }], opacity }]}
      />
      {/* the cut-out with a soft white edge */}
      <Image source={{ uri }} contentFit="contain" style={[StyleSheet.absoluteFill, styles.stroke, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stroke:
    Platform.OS === 'ios'
      ? { shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 2.5, shadowOffset: { width: 0, height: 0 } }
      : {},
});
