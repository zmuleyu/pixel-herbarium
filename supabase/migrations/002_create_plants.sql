CREATE TABLE plants (
  id               SERIAL PRIMARY KEY,
  name_ja          TEXT NOT NULL,
  name_en          TEXT NOT NULL,
  name_latin       TEXT NOT NULL,
  rarity           INT  NOT NULL CHECK (rarity BETWEEN 1 AND 3),
  season           TEXT[] NOT NULL DEFAULT '{}',
  region           TEXT NOT NULL DEFAULT 'JP',
  prefectures      TEXT[] NOT NULL DEFAULT '{}',
  hanakotoba       TEXT,                    -- Japanese flower language
  flower_meaning   TEXT,                    -- English meaning
  bloom_months     INT[] NOT NULL DEFAULT '{}',
  available_window DATERANGE,              -- NULL = always available; set for ★★★ seasonal-limited
  pixel_sprite_url TEXT,                   -- Pre-generated 256x256 sprite URL
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plants_rarity ON plants (rarity);
CREATE INDEX idx_plants_region ON plants (region);
-- GiST index on available_window for fast range containment queries
CREATE INDEX idx_plants_window ON plants USING GIST (available_window) WHERE available_window IS NOT NULL;
