-- 025_analytics_events.sql
-- Generic analytics event log (Phase 3).
-- Tracks key user actions: LINE login, share, viral install, OA friend-add, etc.

CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  properties  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_user_id    ON analytics_events(user_id, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role reads all events (for dashboards / data exports)
CREATE POLICY "Service role can read all"
  ON analytics_events FOR SELECT
  USING (auth.role() = 'service_role');
