// src/utils/guide-storage.ts
// Utility functions to reset guide seen-state from the Settings help page.
// Mirrors the key convention used in useGuideState hook: `guide_seen_<featureKey>`.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEY_PREFIX = 'guide_seen_';

export const ALL_GUIDE_FEATURE_KEYS = ['discover', 'stamp', 'herbarium', 'map'] as const;

export type GuideFeatureKey = (typeof ALL_GUIDE_FEATURE_KEYS)[number];

/** Remove the seen flag for a single feature so the guide will show again. */
export async function resetGuide(featureKey: string): Promise<void> {
  await AsyncStorage.removeItem(`${KEY_PREFIX}${featureKey}`);
}

/** Remove seen flags for all known features. */
export async function resetAllGuides(): Promise<void> {
  const keys = ALL_GUIDE_FEATURE_KEYS.map((k) => `${KEY_PREFIX}${k}`);
  await AsyncStorage.multiRemove(keys);
}
