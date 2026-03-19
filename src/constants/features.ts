/**
 * Feature flags for PH pivot.
 * CHECKIN_MODE = seasonal check-in flow (current MVP)
 * IDENTIFICATION_MODE = AI plant identification (future, code preserved)
 */
export const FEATURES = {
  /** Seasonal flower spot check-in. Active for v2 launch. */
  CHECKIN_MODE: true,
  /** AI plant identification. Code preserved, hidden via href:null. */
  IDENTIFICATION_MODE: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;
