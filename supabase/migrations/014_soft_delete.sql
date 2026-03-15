-- Add soft-delete flag to profiles.
-- When set, a scheduled job removes the account after 30 days.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ DEFAULT NULL;
