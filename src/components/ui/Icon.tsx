import React from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, useColors } from '@/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export function Icon({ name, size = 22, color, style }: { name: IoniconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const colors = useColors();
  return <Ionicons name={name} size={size} color={color ?? colors.label} style={style} />;
}

/**
 * A rounded monochrome icon tile — the restrained replacement for emoji badges
 * (categories, stats). Tinted fill + single-accent or label-colored glyph.
 */
export function IconTile({
  name,
  size = 44,
  tint,
  glyph,
  style,
}: {
  name: IoniconName;
  size?: number;
  tint?: string;
  glyph?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tint ?? colors.fill,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size * 0.5} color={glyph ?? colors.label} />
    </View>
  );
}
