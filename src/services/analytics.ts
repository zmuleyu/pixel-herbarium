// src/services/analytics.ts
// Fire-and-forget analytics event logger.
// Inserts to analytics_events; never throws — failures are silent.

import { supabase } from '@/services/supabase';

type EventProperties = Record<string, string | number | boolean | null>;

export function trackEvent(eventType: string, properties?: EventProperties): void {
  supabase
    .from('analytics_events')
    .insert({ event_type: eventType, properties: properties ?? {} })
    .then(() => {});
}
