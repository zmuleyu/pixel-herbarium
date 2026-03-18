// supabase/functions/notify-bloom/index.ts
// Called by pg_cron daily at JST 06:00 (UTC 21:00).
// Finds spots entering bloom today and notifies nearby users.
// NOTE: Push notification logic is deferred post-MVP.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const today = new Date();
  const mmdd  = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Find spots whose bloom_early_start equals today
  const { data: spots } = await supabase
    .from('sakura_spots')
    .select('id, name_ja')
    .eq('bloom_early_start', mmdd);

  if (!spots?.length) return new Response('no blooms today', { status: 200 });

  // Full push notification logic deferred — add per-user notification here.

  return new Response(JSON.stringify({ blooming: spots.map((s) => s.name_ja) }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
