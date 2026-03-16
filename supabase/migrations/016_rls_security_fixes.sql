-- Migration 016: RLS Security Fixes
-- Addresses pre-launch security audit findings:
--   1. CRITICAL: check_cooldown_nearby() user validation
--   2. deduct_quota() user validation
--   3. push_tokens policy split (remove DELETE)
--   4. discoveries_update column restriction
--   5. profiles filter deleted users

-- ============================================================
-- 1. CRITICAL: check_cooldown_nearby — prevent cross-user GPS queries
-- ============================================================
CREATE OR REPLACE FUNCTION check_cooldown_nearby(
  p_user_id  UUID,
  p_lat      FLOAT,
  p_lon      FLOAT,
  p_radius   FLOAT,
  p_cutoff   TIMESTAMPTZ
)
RETURNS TABLE(created_at TIMESTAMPTZ) AS $$
BEGIN
  -- Prevent querying other users' exact GPS locations
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot query other users cooldown';
  END IF;
  RETURN QUERY
  SELECT d.created_at
  FROM discoveries d
  WHERE d.user_id = p_user_id
    AND d.created_at >= p_cutoff
    AND ST_DWithin(
      d.location,
      ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
      p_radius
    )
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 2. deduct_quota — validate caller owns the quota
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_quota(p_user_id TEXT, p_month TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_used  INT;
  v_limit INT;
BEGIN
  -- Prevent deducting other users' quota
  IF p_user_id != auth.uid()::text THEN
    RAISE EXCEPTION 'Unauthorized: cannot deduct other users quota';
  END IF;

  INSERT INTO user_quotas (user_id, month, used, "limit")
  VALUES (p_user_id, p_month, 0, 5)
  ON CONFLICT (user_id, month) DO NOTHING;

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

-- refund_quota: called by service role only (auth.uid() is NULL).
-- Keep existing logic — just ensure GREATEST(0,...) prevents negative.
-- No auth.uid() check because service role calls this on pipeline failure.

-- ============================================================
-- 3. push_tokens — split FOR ALL into specific operations (no DELETE)
-- ============================================================
DROP POLICY IF EXISTS "own tokens" ON push_tokens;

CREATE POLICY push_tokens_select ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY push_tokens_insert ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_update ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy → deletion implicitly denied for authenticated users.
-- Token cleanup handled by ON DELETE CASCADE from auth.users.

-- ============================================================
-- 4. discoveries_update — restrict to owner only (WITH CHECK)
-- ============================================================
DROP POLICY IF EXISTS discoveries_update ON discoveries;

CREATE POLICY discoveries_update ON discoveries
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: RLS WITH CHECK prevents changing user_id to another user.
-- plant_id/created_at/location immutability enforced at application layer
-- (Edge Functions never expose update endpoints for these fields).

-- ============================================================
-- 5. profiles — hide users who requested deletion
-- ============================================================
DROP POLICY IF EXISTS "Profiles are viewable by all auth users" ON profiles;

CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (deletion_requested_at IS NULL);

-- Users can still update their own profile (including requesting deletion)
-- via the existing "Users can update own profile" policy.
