/** 4pt spacing grid, matching Apple's layout rhythm. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/** Standard iOS corner radii (continuous-feel, generous on cards). */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  card: 22,
  xxl: 28,
  full: 999,
};

/** Minimum tappable target per HIG. */
export const HIT_TARGET = 44;

/**
 * Soft, layered iOS-style shadows. Subtle by design — depth without grime.
 * Use via spread: `style={[styles.card, shadow.sm]}`.
 */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
} as const;
