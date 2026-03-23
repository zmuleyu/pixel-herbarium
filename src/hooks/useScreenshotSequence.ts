import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FEATURES } from '@/constants/features';

/**
 * Auto-navigate through tabs when SCREENSHOT_MODE is active.
 * CI captures screenshots at known time offsets synced to this schedule.
 *
 * Timeline (from app launch):
 *   T+0s:  home (app starts here — no navigation needed)
 *   T+8s:  checkin tab
 *   T+13s: settings tab
 *   T+18s: back to home (for detail card tap by CI)
 */
const SCREENSHOT_SEQUENCE = [
  { tab: '/(tabs)/home',     delay: 0 },
  { tab: '/(tabs)/checkin',  delay: 8000 },
  { tab: '/(tabs)/settings', delay: 13000 },
  { tab: '/(tabs)/home',     delay: 18000 },
] as const;

export function useScreenshotSequence() {
  const router = useRouter();

  useEffect(() => {
    if (!FEATURES.SCREENSHOT_MODE) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const step of SCREENSHOT_SEQUENCE) {
      if (step.delay === 0) continue;
      const t = setTimeout(() => {
        console.log(`[SCREENSHOT_SEQ] → ${step.tab}`);
        router.push(step.tab as any);
      }, step.delay);
      timers.push(t);
    }

    console.log('[SCREENSHOT_SEQ] Sequence scheduled, total ~20s');
    return () => timers.forEach(clearTimeout);
  }, [router]);
}
