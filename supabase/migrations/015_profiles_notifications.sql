-- Migration 015: add notifications_enabled column to profiles
-- Controls whether the user receives seasonal push notifications.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true;
