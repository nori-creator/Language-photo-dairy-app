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
 * Soft, layered iOS-style shadows — faint and low, never dark/hard (per HIG).
 * Tuned to the Liquid Glass spec presets. Use via spread: `[styles.card, shadow.card]`.
 *
 * `sm`/`md`/`lg` are kept as aliases so existing call-sites stay valid.
 */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  popover: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modal: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  fab: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  get sm() { return this.card; },
  get md() { return this.popover; },
  get lg() { return this.modal; },
} as const;
