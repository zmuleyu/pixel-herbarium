import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { FEATURES } from '@/constants/features';

/**
 * Auto-navigate through tabs when SCREENSHOT_MODE is active.
 * Waits until tabs are mounted (segments[0] === '(tabs)') before starting.
 * CI captures screenshots at known time offsets synced to this schedule.
 *
 * Timeline (from tabs ready, NOT from app launch):
 *   T+0s:  home (already here after auth redirect)
 *   T+5s:  checkin tab
 *   T+10s: settings tab
 *   T+15s: back to home (for detail card tap by CI)
 */
const SCREENSHOT_SEQUENCE = [
  { tab: '/(tabs)/checkin',  delay: 5000 },
  { tab: '/(tabs)/settings', delay: 10000 },
  { tab: '/(tabs)/home',     delay: 15000 },
] as const;

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
    console.log('[SCREENSHOT_SEQ] Tabs ready — scheduling navigation');

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const step of SCREENSHOT_SEQUENCE) {
      const t = setTimeout(() => {
        console.log(`[SCREENSHOT_SEQ] → ${step.tab}`);
        router.push(step.tab as any);
      }, step.delay);
      timers.push(t);
    }

    console.log('[SCREENSHOT_SEQ] Sequence scheduled: checkin@5s, settings@10s, home@15s');
    return () => timers.forEach(clearTimeout);
  }, [router, segments]);
}
