-- Migration 012: respect map_visible in get_nearby_discoveries
-- Depends on: 011_profiles_map_visible (map_visible column must exist)
-- Discoveries from users with map_visible = false are hidden from the City Map.

CREATE OR REPLACE FUNCTION get_nearby_discoveries(lat FLOAT, lon FLOAT, radius FLOAT)
RETURNS TABLE(
  id             UUID,
  user_id        UUID,
  plant_id       INT,
  pixel_url      TEXT,
  location_fuzzy GEOGRAPHY,
  city           TEXT,
  user_note      TEXT,
  is_public      BOOLEAN,
  created_at     TIMESTAMPTZ
) AS $$
  -- IMPORTANT: `location` (exact GPS) is intentionally excluded.
  -- Only returns discoveries from users who have opted in to map sharing.
  SELECT d.id, d.user_id, d.plant_id, d.pixel_url,
         d.location_fuzzy, d.city, d.user_note,
         d.is_public, d.created_at
  FROM discoveries d
  JOIN profiles p ON p.id = d.user_id
  WHERE d.is_public = true
    AND p.map_visible = true
    AND ST_DWithin(
      d.location_fuzzy,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
      radius
    )
  ORDER BY d.created_at DESC
  LIMIT 100;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
