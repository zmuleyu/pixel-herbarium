-- supabase/migrations/021_sakura_spots.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. sakura_spots (static, publicly readable)
-- Schema aligned with src/types/hanami.ts::FlowerSpot and src/data/seasons/sakura.json
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sakura_spots (
  id                INTEGER PRIMARY KEY,
  season_id         TEXT    NOT NULL DEFAULT 'sakura',
  name_ja           TEXT    NOT NULL,
  name_en           TEXT    NOT NULL,
  prefecture        TEXT    NOT NULL,
  prefecture_code   INTEGER NOT NULL,
  city              TEXT    NOT NULL,
  category          TEXT    NOT NULL
    CHECK (category IN ('park','river','shrine','castle','mountain','street','garden')),
  tree_count        INTEGER,
  bloom_early_start TEXT,
  bloom_peak_start  TEXT,
  bloom_peak_end    TEXT,
  bloom_late_end    TEXT,
  lat               FLOAT   NOT NULL,
  lng               FLOAT   NOT NULL,
  tags              TEXT[]  NOT NULL DEFAULT '{}',
  description       TEXT,
  custom_sprite_url TEXT,
  access_note       TEXT,
  sort_order        INTEGER,
  best_time         TEXT,
  facilities        TEXT[]
);

ALTER TABLE sakura_spots
  ADD COLUMN location GEOGRAPHY(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;

CREATE INDEX idx_sakura_spots_location ON sakura_spots USING GIST (location);

ALTER TABLE sakura_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spots are publicly readable"
  ON sakura_spots FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. spot_checkins (user-owned)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE spot_checkins (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id                 INTEGER     NOT NULL REFERENCES sakura_spots(id),
  checked_in_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_mankai               BOOLEAN     NOT NULL DEFAULT false,
  stamp_variant           TEXT        NOT NULL DEFAULT 'normal'
    CHECK (stamp_variant IN ('normal', 'mankai')),
  bloom_status_at_checkin TEXT
    CHECK (bloom_status_at_checkin IN ('pre','budding','partial','peak','falling','ended')),
  UNIQUE (user_id, spot_id)
);

ALTER TABLE spot_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own checkins"
  ON spot_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own checkins"
  ON spot_checkins FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own checkins"
  ON spot_checkins FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "checkins are publicly viewable"
  ON spot_checkins FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. checkin_spot RPC (idempotent)
-- Returns JSON: { checkin: {...}, is_new_row: boolean }
-- Only on first check-in during peak bloom: increments user_quotas.limit by 1
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION checkin_spot(
  p_spot_id     INTEGER,
  p_is_peak     BOOLEAN,
  p_bloom_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid     UUID  := auth.uid();
  v_uid_txt TEXT  := v_uid::TEXT;
  v_checkin spot_checkins;
  v_is_new  BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO spot_checkins (user_id, spot_id, is_mankai, stamp_variant, bloom_status_at_checkin)
  VALUES (
    v_uid,
    p_spot_id,
    p_is_peak,
    CASE WHEN p_is_peak THEN 'mankai' ELSE 'normal' END,
    p_bloom_status
  )
  ON CONFLICT (user_id, spot_id) DO UPDATE
    SET checked_in_at = spot_checkins.checked_in_at
  RETURNING *, (xmax = 0) AS is_new INTO v_checkin, v_is_new;

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
    'checkin',    row_to_json(v_checkin),
    'is_new_row', v_is_new
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. pg_cron: daily bloom notification trigger (JST 06:00 = UTC 21:00 prev day)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'check-bloom-notifications',
  '0 21 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.edge_function_url') || '/notify-bloom',
      headers := jsonb_build_object(
                   'Authorization',
                   'Bearer ' || current_setting('app.service_role_key')
                 ),
      body    := '{}'::jsonb
    );
  $$
);
