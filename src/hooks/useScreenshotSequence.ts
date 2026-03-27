import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { FEATURES } from '@/constants/features';
import { signalAndWait, clearScreenshotSignals } from '@/hooks/utils/screenshotSignal';

/**
 * Signal-driven screenshot sequence for CI capture.
 *
 * Replaces the previous setTimeout-based approach that required precise
 * timing synchronization between the app and CI scripts.
 *
 * Protocol (per screen):
 *   1. App navigates to tab and waits for render to settle
 *   2. App writes a signal file to Documents/
 *   3. CI detects signal → captures screenshot → deletes signal
 *   4. App detects deletion → proceeds to next screen
 *
 * Outside CI (Expo Go / real device), signals time out after 30s
 * and the sequence continues — no impact on normal usage.
 */
export function useScreenshotSequence() {
  const router = useRouter();
  const segments = useSegments();
  const started = useRef(false);

  useEffect(() => {
    if (!FEATURES.SCREENSHOT_MODE) return;
    if (started.current) return;

    // Wait until tabs are actually mounted
    const inTabs = segments[0] === '(tabs)';
    if (!inTabs) {
      console.log('[SCREENSHOT_SEQ] Waiting for tabs to mount...');
      return;
    }

    started.current = true;
    console.log('[SCREENSHOT_SEQ] Tabs ready — starting signal-driven sequence');

    const run = async () => {
      await clearScreenshotSignals();

      // Navigate to home explicitly — don't assume we're already there
      // (redirect in _layout.tsx may not fire if tabs are already mounted)
      router.replace('/(tabs)/home' as any);
      await waitForRender();
      // Extra settle: home uses useStaggeredEntry animations (4 components)
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // 01 — Home
      await signalAndWait('screenshot_ready_home');

      // 02 — Checkin (photo step, no tooltip in SCREENSHOT_MODE)
      router.push('/(tabs)/checkin' as any);
      await waitForRender();
      await signalAndWait('screenshot_ready_checkin');

      // 03 — Footprint (history grid with emoji placeholders)
      router.push('/(tabs)/footprint' as any);
      await waitForRender();
      await signalAndWait('screenshot_ready_footprint');

      // 04 — Settings
      router.push('/(tabs)/settings' as any);
      await waitForRender();
      await signalAndWait('screenshot_ready_settings');

      console.log('[SCREENSHOT_SEQ] Sequence complete');
    };

    run().catch(err => console.error('[SCREENSHOT_SEQ] Error:', err));
  }, [router, segments]);
}

/** Resolve after all pending interactions (animations, layout) are done. */
function waitForRender(): Promise<void> {
  return new Promise(resolve =>
    InteractionManager.runAfterInteractions(() => {
      // Extra frame to let React commit
      requestAnimationFrame(() => resolve());
    }),
  );
}
