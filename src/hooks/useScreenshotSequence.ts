import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { FEATURES } from '@/constants/features';

/**
 * Auto-navigate through tabs when SCREENSHOT_MODE is active.
 * Waits until tabs are mounted (segments[0] === '(tabs)') before starting.
 * CI captures screenshots at known time offsets synced to this schedule.
 *
 * Synced with scripts/local-screenshots.sh capture times:
 *   Script (from launch): T+15s home, T+30s checkin, T+45s settings, T+60s tap
 *   Hook (from tabs mount): +17s checkin, +32s settings, +47s home
 *   Auth bootstrap 3-8s gives 5-12s buffer per capture window.
 *
 * With auth=5s: mount@T+5 → checkin@T+22 → settings@T+37 → home@T+52
 *   T+15 captures home ✓  T+30 captures checkin ✓
 *   T+45 captures settings ✓  T+60 taps home ✓
 */
const SCREENSHOT_SEQUENCE = [
  { tab: '/(tabs)/checkin',  delay: 17000 },
  { tab: '/(tabs)/settings', delay: 32000 },
  { tab: '/(tabs)/home',     delay: 47000 },
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

    console.log('[SCREENSHOT_SEQ] Sequence scheduled: checkin@17s, settings@32s, home@47s');
    return () => timers.forEach(clearTimeout);
  }, [router, segments]);
}
