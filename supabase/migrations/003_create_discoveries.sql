CREATE TABLE discoveries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id       INT  NOT NULL REFERENCES plants(id),
  photo_url      TEXT NOT NULL,            -- Supabase Storage URL (private bucket)
  pixel_url      TEXT,                     -- Generated pixel art URL (nullable = fallback to sprite)
  location       GEOGRAPHY(Point, 4326) NOT NULL,       -- Exact GPS (private, never exposed)
  location_fuzzy GEOGRAPHY(Point, 4326) NOT NULL,       -- ±100m offset (used for public map)
  city           TEXT,                     -- Reverse-geocoded city name
  user_note      TEXT,
  is_public      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discoveries_user    ON discoveries (user_id);
CREATE INDEX idx_discoveries_plant   ON discoveries (plant_id);
CREATE INDEX idx_discoveries_created ON discoveries (created_at DESC);
-- GiST index on fuzzy location for ST_DWithin city map queries
CREATE INDEX idx_discoveries_fuzzy_geo ON discoveries USING GIST (location_fuzzy);
