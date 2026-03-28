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

    // Wait until we are actually on the home tab (not just in tabs).
    // _layout.tsx redirect fires router.replace('/(tabs)/home') after bootstrap.
    // We must wait for that redirect to complete before starting the sequence,
    // otherwise our own router.replace races with it and the screenshot may
    // capture the wrong tab.
    const inHome = segments[0] === '(tabs)' && segments[1] === 'home';
    if (!inHome) {
      console.log('[SCREENSHOT_SEQ] Waiting for home tab...', segments);
      return;
    }

    started.current = true;
    console.log('[SCREENSHOT_SEQ] Home tab ready — starting signal-driven sequence');

    const run = async () => {
      await clearScreenshotSignals();

      // Already on home — wait for staggered entry animations to finish
      await waitForRender();
      await delay(1500); // CI cold start: LinearGradient + 4 staggered components

      // 01 — Home
      console.log('[SCREENSHOT_SEQ] Signaling home');
      await signalAndWait('screenshot_ready_home');

      // 02 — Diary (check-in history as photo diary)
      router.push('/(tabs)/checkin' as any);
      await waitForRender();
      await delay(500); // stat cards + grid settle
      console.log('[SCREENSHOT_SEQ] Signaling checkin/diary');
      await signalAndWait('screenshot_ready_checkin');

      // 03 — Settings
      router.push('/(tabs)/settings' as any);
      await waitForRender();
      await delay(500);
      console.log('[SCREENSHOT_SEQ] Signaling settings');
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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
