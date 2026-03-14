-- ============================================================
-- Migration 009: check_cooldown_nearby RPC
-- Called by antiCheat.ts to enforce the 50m / 7-day cooldown.
-- Uses exact `location` column (private) via SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION check_cooldown_nearby(
  p_user_id  UUID,
  p_lat      FLOAT,
  p_lon      FLOAT,
  p_radius   FLOAT,       -- meters; app passes COOLDOWN_RADIUS_METERS (50)
  p_cutoff   TIMESTAMPTZ  -- app passes now() - 7 days
)
RETURNS TABLE(created_at TIMESTAMPTZ) AS $$
  -- IMPORTANT: queries exact `location` (not location_fuzzy) for accurate anti-cheat.
  -- SECURITY DEFINER is required because `location` is never exposed via RLS.
  SELECT d.created_at
  FROM discoveries d
  WHERE d.user_id = p_user_id
    AND d.created_at >= p_cutoff
    AND ST_DWithin(
      d.location,
      ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
      p_radius
    )
  ORDER BY d.created_at DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
