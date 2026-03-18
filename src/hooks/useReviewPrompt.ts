// src/hooks/useReviewPrompt.ts
// Trigger App Store / Play Store review prompts at golden moments.
// Golden triggers: 'firstCheckin' | 'fiveCheckins'
// Cooldown: 30 days between prompts (stored in AsyncStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const STORAGE_KEY   = 'ph_review_last_shown';
const COOLDOWN_MS   = 30 * 24 * 60 * 60 * 1000;

export type ReviewTrigger = 'firstCheckin' | 'fiveCheckins';

/**
 * Call at golden moments. Internally checks cooldown before requesting.
 * Safe to call multiple times — won't show if within cooldown window.
 */
export async function maybeRequestReview(_trigger: ReviewTrigger): Promise<void> {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return;

  const lastShownRaw = await AsyncStorage.getItem(STORAGE_KEY);
  if (lastShownRaw) {
    const lastShown = new Date(lastShownRaw).getTime();
    if (Date.now() - lastShown < COOLDOWN_MS) return;
  }

  await StoreReview.requestReview();
  await AsyncStorage.setItem(STORAGE_KEY, new Date().toISOString());
}
