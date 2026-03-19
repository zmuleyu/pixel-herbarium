-- ─────────────────────────────────────────────────────────────────────────────
-- 023: Generalize sakura_spots → flower_spots for multi-season support
-- Risk: LOW (25 rows, 0 production checkins, app not yet launched)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rename table: sakura_spots → flower_spots
ALTER TABLE sakura_spots RENAME TO flower_spots;

-- 2. Add region_id column (default 'jp' for existing data)
ALTER TABLE flower_spots ADD COLUMN region_id TEXT NOT NULL DEFAULT 'jp';

-- 3. Rename spatial index
ALTER INDEX idx_sakura_spots_location RENAME TO idx_flower_spots_location;

-- 4. Add season_id to spot_checkins for multi-season queries (NOT NULL with default)
ALTER TABLE spot_checkins ADD COLUMN season_id TEXT NOT NULL DEFAULT 'sakura';

-- 5. Update RLS policy names (cosmetic)
ALTER POLICY "spots are publicly readable" ON flower_spots
  RENAME TO "flower_spots_public_read";

-- 6. Update checkin_spot RPC to reference flower_spots
CREATE OR REPLACE FUNCTION checkin_spot(
  p_spot_id      INTEGER,
  p_is_peak      BOOLEAN,
  p_bloom_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid     UUID  := auth.uid();
  v_uid_txt TEXT  := v_uid::TEXT;
  v_is_new  BOOLEAN;
  v_json    JSON;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate spot exists in flower_spots (was sakura_spots)
  IF NOT EXISTS (SELECT 1 FROM flower_spots WHERE id = p_spot_id) THEN
    RAISE EXCEPTION 'Spot not found';
  END IF;

  INSERT INTO spot_checkins (user_id, spot_id, is_mankai, stamp_variant, bloom_status_at_checkin, season_id)
  VALUES (
    v_uid,
    p_spot_id,
    p_is_peak,
    CASE WHEN p_is_peak THEN 'mankai' ELSE 'normal' END,
    p_bloom_status,
    (SELECT season_id FROM flower_spots WHERE id = p_spot_id)
  )
  ON CONFLICT (user_id, spot_id) DO UPDATE
    SET checked_in_at = spot_checkins.checked_in_at
  RETURNING (xmax = 0) INTO v_is_new;

  SELECT row_to_json(sc) INTO v_json
  FROM spot_checkins sc
  WHERE sc.user_id = v_uid AND sc.spot_id = p_spot_id;

  IF v_is_new AND p_is_peak THEN
    INSERT INTO user_quotas (user_id, month, used, "limit")
    VALUES (v_uid_txt, to_char(now(), 'YYYY-MM'), 0, 5)
    ON CONFLICT (user_id, month) DO NOTHING;

    UPDATE user_quotas
    SET "limit" = "limit" + 1
    WHERE user_id = v_uid_txt
      AND month  = to_char(now(), 'YYYY-MM');
  END IF;

  RETURN json_build_object(
    'checkin',    v_json,
    'is_new_row', v_is_new
  );
END;
$$;
