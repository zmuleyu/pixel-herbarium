CREATE TABLE user_quotas (
  user_id TEXT NOT NULL,   -- auth.users.id (UUID stored as text for composite PK)
  month   TEXT NOT NULL,   -- YYYY-MM format
  used    INT  NOT NULL DEFAULT 0 CHECK (used >= 0),
  "limit" INT  NOT NULL DEFAULT 5,
  PRIMARY KEY (user_id, month)
);

-- Atomic quota deduction (called by Edge Function via service role)
-- Returns true if deducted, false if quota exhausted
CREATE OR REPLACE FUNCTION deduct_quota(p_user_id TEXT, p_month TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_used  INT;
  v_limit INT;
BEGIN
  -- Upsert row for this user+month if not exists
  INSERT INTO user_quotas (user_id, month, used, "limit")
  VALUES (p_user_id, p_month, 0, 5)
  ON CONFLICT (user_id, month) DO NOTHING;

  -- Lock the row and check quota
  SELECT used, "limit" INTO v_used, v_limit
  FROM user_quotas
  WHERE user_id = p_user_id AND month = p_month
  FOR UPDATE;

  IF v_used >= v_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE user_quotas
  SET used = used + 1
  WHERE user_id = p_user_id AND month = p_month;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund 1 quota on pipeline failure
CREATE OR REPLACE FUNCTION refund_quota(p_user_id TEXT, p_month TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_quotas
  SET used = GREATEST(0, used - 1)
  WHERE user_id = p_user_id AND month = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Monthly reset scheduled job (runs at 00:00 on the 1st of each month JST = UTC+9)
SELECT cron.schedule(
  'reset-monthly-quotas',
  '0 15 28-31 * *',   -- 00:00 JST = 15:00 UTC previous day (last days of month)
  $$DELETE FROM user_quotas WHERE month < to_char(now(), 'YYYY-MM')$$
);
