-- ============================================================
-- EketSupply: Final Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create chat_messages table (currently missing)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR artisan_id IN (
           SELECT id FROM public.artisans
           WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         )
    )
  );

CREATE POLICY "Booking participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND booking_id IN (
      SELECT id FROM public.bookings
      WHERE customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR artisan_id IN (
           SELECT id FROM public.artisans
           WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         )
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON public.chat_messages FOR UPDATE
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR artisan_id IN (
           SELECT id FROM public.artisans
           WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         )
    )
  );

-- Enable Realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking ON public.chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON public.chat_messages(read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);


-- 2. Fix bookings.payment_method — remove 'escrow', add 'paystack_split'
--    (Paystack compliance: we no longer hold funds as escrow)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('cash', 'transfer', 'card', 'paystack_split'));

-- Enable Realtime for bookings (so status changes push to app instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
