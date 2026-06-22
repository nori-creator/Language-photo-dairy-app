import { Easing, ReduceMotion, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Motion tokens (Apple HIG / Liquid Glass). Physical springs, never linear,
 * never longer than 0.5s. All configs respect the OS "Reduce Motion" setting
 * via ReduceMotion.System, so honoring accessibility is automatic.
 */
export const spring = {
  /** Quick, settled — buttons, toggles, selection. */
  snappy: { damping: 18, stiffness: 350, mass: 0.7, reduceMotion: ReduceMotion.System } as WithSpringConfig,
  /** Soft settle — sheets, reveals. */
  soft: { damping: 16, stiffness: 170, mass: 0.9, reduceMotion: ReduceMotion.System } as WithSpringConfig,
  /** A touch of overshoot — reward moments only. */
  bouncy: { damping: 11, stiffness: 180, mass: 0.8, reduceMotion: ReduceMotion.System } as WithSpringConfig,
} as const;

export const timing = {
  micro: { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System } as WithTimingConfig,
  standard: { duration: 320, easing: Easing.bezier(0.2, 0.8, 0.2, 1), reduceMotion: ReduceMotion.System } as WithTimingConfig,
  soft: { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1), reduceMotion: ReduceMotion.System } as WithTimingConfig,
} as const;

/** Tap feedback: scale down on press, spring back. Range 0.95–0.97. */
export const PRESS_SCALE = 0.95;
export const PRESS_OPACITY = 0.88;
