import React from 'react';
import { Text, TextProps } from 'react-native';
import { type as ramp, useColors } from '@/theme';

type Variant = keyof typeof ramp;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
}

/** Text bound to Apple's type ramp + semantic label colors. */
export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  const colors = useColors();
  return <Text style={[ramp[variant], { color: color ?? colors.label }, style]} {...rest} />;
}
