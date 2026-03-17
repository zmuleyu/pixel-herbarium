import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

// Haptics only work reliably on iOS physical devices
const safe = async (fn: () => Promise<void>) => {
  if (!isIOS) return;
  try {
    await fn();
  } catch {
    // Ignore haptic errors — not available on simulator or older devices
  }
};

export const HapticPatterns = {
  // Standard plant collection
  plantCollected: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  // Rare / ultra-rare plant discovery: 3 medium pulses with 80ms gap
  rarePlantFound: async () => {
    if (!isIOS) return;
    for (let i = 0; i < 3; i++) {
      await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
      if (i < 2) await new Promise<void>((r) => setTimeout(r, 80));
    }
  },

  // Flower language card flip (front → back → notes)
  cardFlip: () => safe(() => Haptics.selectionAsync()),

  // Season transition (spring → summer → autumn → winter)
  seasonChange: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),

  // Share poster saved to photo library
  posterSaved: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),

  // Invalid action or error feedback
  error: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
};
