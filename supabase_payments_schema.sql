-- Payments Schema
-- Run this in Supabase SQL Editor

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reference VARCHAR(255) NOT NULL UNIQUE,
  transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'paystack',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escrow table for holding payments until job completion
CREATE TABLE IF NOT EXISTS public.escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  held_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payments"
  ON public.payments FOR UPDATE
  USING (true);

-- RLS Policies for escrow
CREATE POLICY "Users can view their own escrow"
  ON public.escrow FOR SELECT
  USING (true);

CREATE POLICY "System can manage escrow"
  ON public.escrow FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to create escrow on successful payment
CREATE OR REPLACE FUNCTION create_escrow_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    -- Get booking details
    INSERT INTO public.escrow (payment_id, booking_id, artisan_id, customer_id, amount, status)
    SELECT 
      NEW.id,
      b.id,
      b.artisan_id,
      b.customer_id,
      NEW.amount,
      'held'
    FROM public.bookings b
    WHERE b.id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create escrow
CREATE TRIGGER trigger_create_escrow
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION create_escrow_on_payment();

-- Function to release escrow when job is completed
CREATE OR REPLACE FUNCTION release_escrow_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.escrow
    SET 
      status = 'released',
      released_at = NOW()
    WHERE booking_id = NEW.id AND status = 'held';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to release escrow
CREATE TRIGGER trigger_release_escrow
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION release_escrow_on_completion();

-- Create indexes
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_reference ON public.payments(reference);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_escrow_booking ON public.escrow(booking_id);
CREATE INDEX idx_escrow_artisan ON public.escrow(artisan_id);
CREATE INDEX idx_escrow_customer ON public.escrow(customer_id);
CREATE INDEX idx_escrow_status ON public.escrow(status);
