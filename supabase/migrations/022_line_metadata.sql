-- Migration 022: LINE OAuth metadata
-- Adds line_uid to profiles for bridging app users to LINE Official Account.
-- Extends handle_new_user() — preserves existing full_name extraction.

ALTER TABLE profiles ADD COLUMN line_uid TEXT UNIQUE;
CREATE INDEX idx_profiles_line_uid ON profiles(line_uid);

-- Extend trigger to also extract line_uid from user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, line_uid)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    NEW.raw_user_meta_data->>'line_uid'
  )
  ON CONFLICT (id) DO UPDATE SET
    line_uid = COALESCE(EXCLUDED.line_uid, profiles.line_uid);
  RETURN NEW;
END;
$$;
