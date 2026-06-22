import { useColorScheme } from 'react-native';

/**
 * iOS system colors (Apple Human Interface Guidelines).
 * Values mirror UIKit's semantic colors in light & dark appearance so the
 * UI feels native on iPhone / iPad. Reference these tokens — never hardcode hex.
 */
export const palette = {
  light: {
    // Backgrounds
    systemBackground: '#FFFFFF',
    secondarySystemBackground: '#F2F2F7',
    tertiarySystemBackground: '#FFFFFF',
    systemGroupedBackground: '#F2F2F7',
    secondarySystemGroupedBackground: '#FFFFFF',

    // Labels
    label: '#000000',
    secondaryLabel: 'rgba(60,60,67,0.6)',
    tertiaryLabel: 'rgba(60,60,67,0.3)',
    quaternaryLabel: 'rgba(60,60,67,0.18)',

    // Separators / fills
    separator: 'rgba(60,60,67,0.29)',
    opaqueSeparator: '#C6C6C8',
    fill: 'rgba(120,120,128,0.2)',
    secondaryFill: 'rgba(120,120,128,0.16)',

    // Accents (iOS system colors)
    blue: '#007AFF',
    green: '#34C759',
    indigo: '#5856D6',
    orange: '#FF9500',
    pink: '#FF2D55',
    purple: '#AF52DE',
    red: '#FF3B30',
    teal: '#30B0C7',
    yellow: '#FFCC00',
  },
  dark: {
    systemBackground: '#000000',
    secondarySystemBackground: '#1C1C1E',
    tertiarySystemBackground: '#2C2C2E',
    systemGroupedBackground: '#000000',
    secondarySystemGroupedBackground: '#1C1C1E',

    label: '#FFFFFF',
    secondaryLabel: 'rgba(235,235,245,0.6)',
    tertiaryLabel: 'rgba(235,235,245,0.3)',
    quaternaryLabel: 'rgba(235,235,245,0.18)',

    separator: 'rgba(84,84,88,0.6)',
    opaqueSeparator: '#38383A',
    fill: 'rgba(120,120,128,0.36)',
    secondaryFill: 'rgba(120,120,128,0.32)',

    blue: '#0A84FF',
    green: '#30D158',
    indigo: '#5E5CE6',
    orange: '#FF9F0A',
    pink: '#FF375F',
    purple: '#BF5AF2',
    red: '#FF453A',
    teal: '#40C8E0',
    yellow: '#FFD60A',
  },
};

export type ColorTokens = typeof palette.light;

export function useColors(): ColorTokens {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palette.dark : palette.light;
}
