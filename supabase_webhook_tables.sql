-- ============================================================
-- EketSupply: Webhook Support Tables & Booking Column Additions
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Idempotency table: prevents double-processing of Paystack webhook events
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
  ON public.processed_webhook_events(event_id);

-- No RLS needed — this table is only accessed by the server (service role key)
-- But enable it for safety and add a service-role-only policy
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.processed_webhook_events
  USING (false); -- blocks all anon/authenticated access; service role bypasses RLS


-- 2. Add missing columns to bookings table (if not already present)

-- Payment tracking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS artisan_settlement_status TEXT DEFAULT 'pending'
    CHECK (artisan_settlement_status IN ('pending', 'settled', 'failed')),
  ADD COLUMN IF NOT EXISTS artisan_settlement_reference TEXT;

-- Index for webhook lookups by payment reference
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference
  ON public.bookings(payment_reference)
  WHERE payment_reference IS NOT NULL;


-- 3. Add push_token column to profiles (for customer push notifications)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 4. Add push_token column to artisans (for artisan push notifications)
ALTER TABLE public.artisans
  ADD COLUMN IF NOT EXISTS push_token TEXT;


-- Verify everything was created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('processed_webhook_events', 'bookings', 'profiles', 'artisans')
ORDER BY table_name;
