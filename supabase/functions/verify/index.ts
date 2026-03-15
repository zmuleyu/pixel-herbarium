import { requireAuth, corsHeaders, jsonResponse } from '../_shared/auth.ts';

interface VerifyRequest {
  lat: number;
  lon: number;
}

interface VerifyResponse {
  allowed: boolean;
  reason?: 'cooldown' | 'quota_exceeded' | 'out_of_region';
  daysRemaining?: number;
}

const COOLDOWN_RADIUS_METERS = 50;
const COOLDOWN_DAYS = 7;

// Approximate bounding box for Japan (mainland + Okinawa + Hokkaido)
const JAPAN_BOUNDS = { latMin: 24.0, latMax: 46.0, lonMin: 122.0, lonMax: 154.0 };

function isInJapan(lat: number, lon: number): boolean {
  return lat >= JAPAN_BOUNDS.latMin && lat <= JAPAN_BOUNDS.latMax &&
         lon >= JAPAN_BOUNDS.lonMin && lon <= JAPAN_BOUNDS.lonMax;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const { userId, supabaseAdmin } = await requireAuth(req);
    const { lat, lon }: VerifyRequest = await req.json();

    // --- Check Japan GPS bounds ---
    if (!isInJapan(lat, lon)) {
      return jsonResponse({ allowed: false, reason: 'out_of_region' } as VerifyResponse);
    }

    // --- Check GPS cooldown via PostGIS RPC ---
    // Returns rows of { created_at } for discoveries within 50m in the last 7 days.
    const cutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: cooldownRows, error: cooldownError } = await supabaseAdmin.rpc(
      'check_cooldown_nearby',
      { p_user_id: userId, p_lat: lat, p_lon: lon, p_radius: COOLDOWN_RADIUS_METERS, p_cutoff: cutoff },
    );
    if (cooldownError) throw cooldownError;

    if (cooldownRows && cooldownRows.length > 0) {
      const lastDiscoveryTime = new Date(cooldownRows[0].created_at).getTime();
      const cooldownEnd = lastDiscoveryTime + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const daysRemaining = Math.max(1, Math.ceil((cooldownEnd - Date.now()) / (24 * 60 * 60 * 1000)));
      const response: VerifyResponse = { allowed: false, reason: 'cooldown', daysRemaining };
      return jsonResponse(response);
    }

    // --- Check monthly quota (read-only preview; deduction happens in /identify) ---
    const month = new Date().toISOString().slice(0, 7);
    const { data: quotaData, error: quotaError } = await supabaseAdmin
      .from('user_quotas')
      .select('used, limit')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle();
    if (quotaError) throw quotaError;

    if (quotaData && quotaData.used >= quotaData.limit) {
      return jsonResponse({ allowed: false, reason: 'quota_exceeded' } as VerifyResponse);
    }

    return jsonResponse({ allowed: true } as VerifyResponse);
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: String(err) }, 500);
  }
});
