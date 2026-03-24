import { FEATURES } from '@/constants/features';
import { SCREENSHOT_DATE, DEMO_CHECKIN_RECORDS } from '@/constants/demo-data';
import { useCheckinStore } from '@/stores/checkin-store';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from '@/hooks/useOnboardingControls';
import { clearScreenshotSignals } from '@/hooks/utils/screenshotSignal';

/**
 * Hook to inject demo data when SCREENSHOT_MODE is active.
 * Call once in _layout.tsx or the root component.
 *
 * Effects:
 * - Overrides Date constructor to return SCREENSHOT_DATE (peak bloom)
 * - Injects DEMO_CHECKIN_RECORDS into checkin store
 */
export function useScreenshotMode() {
  useEffect(() => {
    if (!FEATURES.SCREENSHOT_MODE) return;

    // Override Date to return peak bloom period
    const OriginalDate = globalThis.Date;
    const mockNow = SCREENSHOT_DATE.getTime();

    // Only override no-arg constructor (new Date())
    globalThis.Date = class extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockNow);
        } else {
          // @ts-ignore
          super(...args);
        }
      }
      static now() {
        return mockNow;
      }
    } as any;

    // Bypass onboarding gate so CI reaches tab UI directly
    AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => {});

    // Inject demo checkin records
    useCheckinStore.setState({ history: DEMO_CHECKIN_RECORDS });

    console.log('[SCREENSHOT_MODE] Active — date mocked to', SCREENSHOT_DATE.toISOString());
    console.log('[SCREENSHOT_MODE] Injected', DEMO_CHECKIN_RECORDS.length, 'demo checkin records');

    return () => {
      globalThis.Date = OriginalDate;
      clearScreenshotSignals().catch(() => {});
    };
  }, []);
}
