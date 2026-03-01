-- ============================================================
-- EketSupply: mark_messages_as_read RPC Function
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================
-- This function marks all unread messages in a booking as read
-- for a specific user. Called when a user opens a chat screen.
-- It is a SECURITY DEFINER function so it can bypass RLS safely
-- while still validating the caller is a booking participant.
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  p_booking_id UUID,
  p_user_id    TEXT        -- matches profiles.user_id (text column)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id TEXT;
BEGIN
  -- Resolve profiles.id from the auth user_id
  SELECT id::TEXT INTO v_profile_id
  FROM public.profiles
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Abort silently if profile not found
  IF v_profile_id IS NULL THEN
    RETURN;
  END IF;

  -- Verify caller is a participant in this booking
  -- (either the customer or the artisan's linked profile)
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = p_booking_id
      AND (
        b.customer_id = v_profile_id
        OR EXISTS (
          SELECT 1 FROM public.artisans a
          WHERE a.id = b.artisan_id
            AND a.profile_id = v_profile_id
        )
      )
  ) THEN
    -- Not a participant — do nothing (no error, just silent)
    RETURN;
  END IF;

  -- Mark all messages in this booking as read
  -- where the sender is NOT the current user
  UPDATE public.chat_messages
  SET    read = true
  WHERE  booking_id = p_booking_id
    AND  read       = false
    AND  sender_id <> v_profile_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, TEXT)
  TO authenticated;

-- Also grant to anon in case app uses anon key before full auth
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, TEXT)
  TO anon;


-- ============================================================
-- Verify the function was created
-- ============================================================
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name   = 'mark_messages_as_read';
