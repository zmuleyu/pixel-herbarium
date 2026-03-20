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
  /** Demo data injection for App Store screenshots (peak bloom + mock checkins). */
  // TEMP: hardcoded true for OTA screenshot capture (EAS quota exhausted until 4/1)
  // Original: process.env.EXPO_PUBLIC_SCREENSHOT_MODE === 'true'
  SCREENSHOT_MODE: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;
