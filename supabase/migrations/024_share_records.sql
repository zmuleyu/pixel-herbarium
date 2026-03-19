-- 024_share_records.sql
-- Track shares for viral loop analytics (Phase 2C).
-- Records each share action: who shared, what content, which channel, and the generated deep link.

CREATE TABLE share_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type  TEXT NOT NULL CHECK (share_type IN ('plant', 'spot', 'bouquet')),
  content_id  TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('line', 'instagram', 'twitter', 'other')),
  deep_link   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_share_records_user_id ON share_records(user_id, created_at DESC);
CREATE INDEX idx_share_records_content  ON share_records(share_type, content_id);

ALTER TABLE share_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own shares"
  ON share_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own shares"
  ON share_records FOR SELECT
  USING (auth.uid() = user_id);
