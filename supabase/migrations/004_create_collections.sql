CREATE TABLE collections (
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id           INT  NOT NULL REFERENCES plants(id),
  first_discovery_id UUID NOT NULL REFERENCES discoveries(id),
  count              INT  NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, plant_id)
);

CREATE INDEX idx_collections_user ON collections (user_id);

-- Auto-upsert: every new discovery increments the user's collection count
CREATE OR REPLACE FUNCTION upsert_collection()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO collections (user_id, plant_id, first_discovery_id, count)
  VALUES (NEW.user_id, NEW.plant_id, NEW.id, 1)
  ON CONFLICT (user_id, plant_id)
  DO UPDATE SET count = collections.count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_discovery_upsert_collection
  AFTER INSERT ON discoveries
  FOR EACH ROW EXECUTE FUNCTION upsert_collection();
