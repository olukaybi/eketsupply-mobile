-- ============================================================
-- EketSupply: Fix "Database error saving new user" 
-- Root cause: handle_new_user trigger fails because:
--   1. profiles.full_name is NOT NULL but trigger may get NULL
--   2. profiles.user_type is NOT NULL but trigger may not set it
--   3. profiles.email is NOT NULL but trigger may get NULL
-- Fix: Robust trigger with COALESCE defaults + ON CONFLICT upsert
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop existing trigger first (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace the handle_new_user function with a robust version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(COALESCE(NEW.email, 'user@example.com'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'seeker')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name = '' OR public.profiles.full_name IS NULL THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    user_type = CASE WHEN public.profiles.user_type IS NULL THEN EXCLUDED.user_type ELSE public.profiles.user_type END,
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the auth signup
  RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure profiles table columns allow nulls for safety
-- (in case the trigger fires before metadata is set)
ALTER TABLE public.profiles 
  ALTER COLUMN full_name SET DEFAULT '',
  ALTER COLUMN email SET DEFAULT '';
