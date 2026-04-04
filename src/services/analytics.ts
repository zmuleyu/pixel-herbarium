// src/services/analytics.ts
// Fire-and-forget analytics event logger.
// Inserts to analytics_events; never throws. Failures are downgraded to warnings.

import { supabase } from '@/services/supabase';

type EventProperties = Record<string, string | number | boolean | null>;

export function trackEvent(eventType: string, properties?: EventProperties): void {
  supabase
    .from('analytics_events')
    .insert({ event_type: eventType, properties: properties ?? {} })
    .then(({ error }: any) => {
      if (error) {
        console.warn('trackEvent: failed to persist analytics event', error);
      }
    }, (error: unknown) => {
      console.warn('trackEvent: unexpected analytics failure', error);
    });
}
