-- ============================================================
-- Enable RLS on all user-data tables
-- ============================================================
ALTER TABLE discoveries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bouquets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas  ENABLE ROW LEVEL SECURITY;

-- plants table is read-only public data — no RLS needed
-- (service role handles inserts via migrations/seed)

-- ============================================================
-- discoveries
-- ============================================================
-- Read: public discoveries visible to all; own private ones visible to owner only
CREATE POLICY discoveries_select ON discoveries FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

-- Write: users can only insert their own discoveries
CREATE POLICY discoveries_insert ON discoveries FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update: only own discoveries (e.g. toggle is_public, add note)
CREATE POLICY discoveries_update ON discoveries FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- collections
-- ============================================================
-- Read: all collections are visible (needed for friend herbarium visit)
CREATE POLICY collections_select ON collections FOR SELECT
  USING (true);

-- Write: trigger function uses SECURITY DEFINER — no direct client INSERT allowed
-- (collections are populated automatically by trg_discovery_upsert_collection)

-- ============================================================
-- friendships
-- ============================================================
-- Read: can see requests involving you (as requester or addressee)
CREATE POLICY friendships_select ON friendships FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Send request: only as requester
CREATE POLICY friendships_insert ON friendships FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Accept/reject/remove: only parties involved
CREATE POLICY friendships_update ON friendships FOR UPDATE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY friendships_delete ON friendships FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- ============================================================
-- bouquets
-- ============================================================
-- Read: see bouquets you sent or received
CREATE POLICY bouquets_select ON bouquets FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Send: only as sender
CREATE POLICY bouquets_insert ON bouquets FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Update status (accept/decline): only receiver
CREATE POLICY bouquets_update ON bouquets FOR UPDATE
  USING (receiver_id = auth.uid());

-- ============================================================
-- user_quotas
-- ============================================================
-- Read: own quota only (so the UI can display remaining count)
CREATE POLICY quotas_select ON user_quotas FOR SELECT
  USING (user_id = auth.uid()::text);

-- IMPORTANT: No INSERT/UPDATE policy for anon/authenticated role.
-- All quota mutations happen via deduct_quota / refund_quota RPCs
-- which are SECURITY DEFINER and run as service role.

-- ============================================================
-- PostGIS: city map function (returns fuzzy location only)
-- ============================================================
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
  -- IMPORTANT: `location` (exact GPS) is intentionally excluded
  SELECT d.id, d.user_id, d.plant_id, d.pixel_url,
         d.location_fuzzy, d.city, d.user_note,
         d.is_public, d.created_at
  FROM discoveries d
  WHERE d.is_public = true
    AND ST_DWithin(
      d.location_fuzzy,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
      radius
    )
  ORDER BY d.created_at DESC
  LIMIT 100;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
