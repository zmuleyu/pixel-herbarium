-- Migration 011: add map_visible column to profiles
-- Controls whether the user's discoveries appear on the City Map.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS map_visible BOOLEAN NOT NULL DEFAULT true;
