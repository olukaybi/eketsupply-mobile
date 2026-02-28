-- Migration: Add Paystack Subaccount Support
-- This migration adds subaccount tracking to enable split payments
-- Run this in Supabase SQL Editor after Paystack approves your account

-- 1. Add paystack_subaccount_code column to artisans table
ALTER TABLE artisans 
ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artisans_subaccount 
ON artisans(paystack_subaccount_code);

-- Add comment
COMMENT ON COLUMN artisans.paystack_subaccount_code IS 
'Paystack subaccount code for automatic payment splitting (85% to artisan, 15% to EketSupply)';

-- 2. Update RLS policies (no changes needed - existing policies cover new column)

-- 3. Create function to check if artisan has subaccount
CREATE OR REPLACE FUNCTION has_paystack_subaccount(artisan_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subaccount_code TEXT;
BEGIN
  SELECT paystack_subaccount_code INTO subaccount_code
  FROM artisans
  WHERE id = artisan_id_param;
  
  RETURN subaccount_code IS NOT NULL AND subaccount_code != '';
END;
$$;

-- 4. Add payment_reference column to bookings table (for Paystack transaction tracking)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Add index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference 
ON bookings(payment_reference);

-- Add comments
COMMENT ON COLUMN bookings.payment_reference IS 
'Paystack transaction reference for payment tracking and verification';

COMMENT ON COLUMN bookings.payment_status IS 
'Payment status: pending (not paid), paid (successful), failed (payment failed), refunded (refund processed)';

-- 5. Create payments table for detailed transaction tracking
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL, -- Amount in Naira
  reference TEXT NOT NULL UNIQUE, -- Paystack transaction reference
  transaction_id TEXT, -- Paystack transaction ID
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'paystack',
  artisan_amount DECIMAL(10, 2), -- Amount paid to artisan (85%)
  platform_fee DECIMAL(10, 2), -- EketSupply commission (15%)
  paystack_fee DECIMAL(10, 2), -- Paystack transaction fee
  subaccount_code TEXT, -- Artisan's Paystack subaccount code
  refund_amount DECIMAL(10, 2), -- Amount refunded (if any)
  refund_reason TEXT, -- Reason for refund
  metadata JSONB, -- Additional payment metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Add comments
COMMENT ON TABLE payments IS 
'Detailed payment transaction records for all bookings with Paystack split payment tracking';

COMMENT ON COLUMN payments.artisan_amount IS 
'Amount paid to artisan (85% of booking amount after fees)';

COMMENT ON COLUMN payments.platform_fee IS 
'EketSupply platform commission (15% of booking amount)';

-- 6. Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own payments (as customer or artisan)
CREATE POLICY payments_select_own ON payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = payments.booking_id
    AND (b.customer_id = auth.uid() OR b.artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    ))
  )
);

-- RLS Policy: System can insert payment records
CREATE POLICY payments_insert_system ON payments
FOR INSERT
WITH CHECK (true); -- Allow inserts from backend/webhooks

-- RLS Policy: System can update payment status
CREATE POLICY payments_update_system ON payments
FOR UPDATE
USING (true); -- Allow updates from backend/webhooks

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- 8. Create view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT
  DATE_TRUNC('day', created_at) AS payment_date,
  COUNT(*) AS total_transactions,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_transactions,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_transactions,
  COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_transactions,
  SUM(amount) FILTER (WHERE status = 'success') AS total_revenue,
  SUM(platform_fee) FILTER (WHERE status = 'success') AS total_platform_fees,
  SUM(artisan_amount) FILTER (WHERE status = 'success') AS total_artisan_payouts,
  SUM(paystack_fee) FILTER (WHERE status = 'success') AS total_paystack_fees,
  AVG(amount) FILTER (WHERE status = 'success') AS avg_transaction_amount
FROM payments
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY payment_date DESC;

COMMENT ON VIEW payment_analytics IS 
'Daily payment analytics showing transaction volumes, success rates, and revenue breakdown';

-- 9. Create function to calculate payment split
CREATE OR REPLACE FUNCTION calculate_payment_split(booking_amount DECIMAL)
RETURNS TABLE (
  artisan_amount DECIMAL,
  platform_fee DECIMAL,
  paystack_fee DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  amount_in_kobo INTEGER;
  paystack_fee_kobo INTEGER;
  amount_after_fees_kobo INTEGER;
  artisan_amount_kobo INTEGER;
  platform_fee_kobo INTEGER;
BEGIN
  -- Convert to kobo
  amount_in_kobo := (booking_amount * 100)::INTEGER;
  
  -- Calculate Paystack fee: 1.5% + ₦100
  paystack_fee_kobo := CEIL(amount_in_kobo * 0.015) + 10000; -- ₦100 = 10000 kobo
  
  -- Amount after Paystack fees
  amount_after_fees_kobo := amount_in_kobo - paystack_fee_kobo;
  
  -- Split: 85% to artisan, 15% to platform
  artisan_amount_kobo := FLOOR(amount_after_fees_kobo * 0.85);
  platform_fee_kobo := amount_after_fees_kobo - artisan_amount_kobo;
  
  -- Return in Naira
  RETURN QUERY SELECT
    (artisan_amount_kobo / 100.0)::DECIMAL AS artisan_amount,
    (platform_fee_kobo / 100.0)::DECIMAL AS platform_fee,
    (paystack_fee_kobo / 100.0)::DECIMAL AS paystack_fee;
END;
$$;

COMMENT ON FUNCTION calculate_payment_split IS 
'Calculate payment split: 85% to artisan, 15% to EketSupply, after Paystack fees (1.5% + ₦100)';

-- Example usage:
-- SELECT * FROM calculate_payment_split(10000); -- For ₦10,000 booking

-- 10. Create trigger to auto-calculate payment splits
CREATE OR REPLACE FUNCTION auto_calculate_payment_split()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  split RECORD;
BEGIN
  -- Calculate split when payment is successful
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    SELECT * INTO split FROM calculate_payment_split(NEW.amount);
    
    NEW.artisan_amount := split.artisan_amount;
    NEW.platform_fee := split.platform_fee;
    NEW.paystack_fee := split.paystack_fee;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_auto_calculate_split
BEFORE INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_payment_split();

-- 11. Migration verification queries
-- Run these to verify migration was successful

-- Check if subaccount column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artisans' 
AND column_name = 'paystack_subaccount_code';

-- Check if payments table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'payments';

-- Check if payment_reference column was added to bookings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('payment_reference', 'payment_status');

-- Test payment split calculation
SELECT * FROM calculate_payment_split(10000); -- ₦10,000 booking
SELECT * FROM calculate_payment_split(50000); -- ₦50,000 booking

-- 12. Sample data for testing (optional - remove in production)
/*
-- Example: Update artisan with test subaccount code
UPDATE artisans 
SET paystack_subaccount_code = 'ACCT_test123456789'
WHERE id = 'your-artisan-id-here';

-- Example: Create test payment record
INSERT INTO payments (
  booking_id,
  amount,
  reference,
  status,
  subaccount_code
) VALUES (
  'your-booking-id-here',
  10000,
  'EKET-test-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'success',
  'ACCT_test123456789'
);
*/

-- Migration complete!
-- Next steps:
-- 1. Update artisan onboarding flow to create Paystack subaccounts
-- 2. Update payment initialization to include subaccount_code
-- 3. Update webhook handler to record payment details in payments table
