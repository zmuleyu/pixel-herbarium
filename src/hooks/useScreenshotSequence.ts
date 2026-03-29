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

    // Wait until tabs are mounted (segments[0] === '(tabs)').
    // Note: root layout's useSegments() only returns segments up to the
    // current route group — segments[1] is NOT reliable here.
    const inTabs = segments[0] === '(tabs)';
    if (!inTabs) {
      console.log('[SCREENSHOT_SEQ] Waiting for tabs...', segments);
      return;
    }

    started.current = true;
    console.log('[SCREENSHOT_SEQ] Tabs ready — starting signal-driven sequence');

    const run = async () => {
      await clearScreenshotSignals();

      // 01 — Home: navigate to home tab, wait for animations, then signal CI.
      // Timeout must exceed CI's cold-start sleep (~50s after app launch)
      // so the app is still waiting when CI begins polling.
      console.log('[SCREENSHOT_SEQ] Navigating to home tab...');
      router.replace('/(tabs)/home' as any);
      await delay(3000); // allow staggered entry animations (2s) + buffer
      console.log('[SCREENSHOT_SEQ] Waiting for home tab signal...');
      await signalAndWait('screenshot_ready_home', 120000);

      // 02 — Diary (check-in history as photo diary)
      router.push('/(tabs)/checkin' as any);
      await waitForRender();
      await delay(500); // stat cards + grid settle
      await signalAndWait('screenshot_ready_checkin', 60000);

      // 03 — Settings
      router.push('/(tabs)/settings' as any);
      await waitForRender();
      await delay(500);
      await signalAndWait('screenshot_ready_settings', 60000);

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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
