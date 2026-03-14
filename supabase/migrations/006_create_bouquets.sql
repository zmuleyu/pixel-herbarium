CREATE TABLE bouquets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_ids   INT[] NOT NULL CHECK (array_length(plant_ids, 1) BETWEEN 3 AND 5),
  message     TEXT  CHECK (char_length(message) <= 200),
  status      TEXT  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_bouquet CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_bouquets_receiver ON bouquets (receiver_id, status);
CREATE INDEX idx_bouquets_sender   ON bouquets (sender_id);
-- For expiry cleanup job
CREATE INDEX idx_bouquets_expires  ON bouquets (expires_at) WHERE status = 'pending';
