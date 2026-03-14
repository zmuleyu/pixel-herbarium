import { supabase } from './supabase';
import { COOLDOWN_RADIUS_METERS, COOLDOWN_DAYS, MONTHLY_QUOTA } from '@/constants/plants';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface CooldownResult {
  allowed: boolean;
  daysRemaining?: number;
}

interface QuotaResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Checks whether the user can discover a plant at the given location.
 * Calls the check_cooldown Supabase RPC which uses PostGIS ST_DWithin.
 * Returns allowed=false + daysRemaining if within 50m of a previous discovery in the last 7 days.
 */
export async function checkCooldown(
  userId: string,
  coord: Coordinate,
): Promise<CooldownResult> {
  const cutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 3600 * 1000).toISOString();

  const { data, error } = await (supabase as any).rpc('check_cooldown_nearby', {
    p_user_id: userId,
    p_lat: coord.latitude,
    p_lon: coord.longitude,
    p_radius: COOLDOWN_RADIUS_METERS,
    p_cutoff: cutoff,
  });

  if (error) throw error;

  const rows = (data as Array<{ created_at: string }>) ?? [];
  if (rows.length === 0) {
    return { allowed: true };
  }

  // Find the most recent discovery and calculate days remaining
  const mostRecent = rows.reduce((latest, row) =>
    new Date(row.created_at) > new Date(latest.created_at) ? row : latest,
  );
  const ageMs = Date.now() - new Date(mostRecent.created_at).getTime();
  const ageDays = ageMs / (24 * 3600 * 1000);
  const daysRemaining = Math.ceil(COOLDOWN_DAYS - ageDays);

  return { allowed: false, daysRemaining: Math.max(1, daysRemaining) };
}

/**
 * Checks the user's remaining monthly discovery quota.
 * Returns allowed=false when used >= limit.
 */
export async function checkQuota(userId: string): Promise<QuotaResult> {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data, error } = await (supabase
    .from('user_quotas')
    .select('used, limit')
    .eq('user_id', userId)
    .eq('month', month)
    .limit(1) as any);

  if (error) throw error;

  const rows = (data as Array<{ used: number; limit: number }>) ?? [];
  if (rows.length === 0) {
    // No row yet — user has full quota
    return { allowed: true, remaining: MONTHLY_QUOTA };
  }

  const { used, limit } = rows[0];
  const remaining = Math.max(0, limit - used);
  return { allowed: used < limit, remaining };
}
