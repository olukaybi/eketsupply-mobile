-- ============================================================
-- EketSupply: Set Admin Role
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- OPTION 1: Set admin by email (most reliable)
-- Replace 'your-email@example.com' with the account email used to sign up
UPDATE profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id::text
  FROM auth.users
  WHERE email = 'your-email@example.com'
);

-- ─────────────────────────────────────────────────────────────
-- OPTION 2: Set admin by user_id directly
-- Replace 'YOUR_USER_ID_HERE' with the UUID from auth.users
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE user_id = 'YOUR_USER_ID_HERE';

-- ─────────────────────────────────────────────────────────────
-- VERIFY: Confirm the role was set correctly
SELECT p.id, p.full_name, p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id::text = p.user_id
WHERE p.role = 'admin';
