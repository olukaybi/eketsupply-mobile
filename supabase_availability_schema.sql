-- Artisan Availability Schema
-- Run this in Supabase SQL Editor after the main schema

-- Availability slots table
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artisan_id, day_of_week, start_time)
);

-- Blocked dates (for vacations, holidays, etc.)
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artisan_id, blocked_date)
);

-- Enable RLS
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for availability_slots
CREATE POLICY "Anyone can view availability slots"
  ON public.availability_slots FOR SELECT
  USING (true);

CREATE POLICY "Artisans can manage their own availability"
  ON public.availability_slots FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for blocked_dates
CREATE POLICY "Anyone can view blocked dates"
  ON public.blocked_dates FOR SELECT
  USING (true);

CREATE POLICY "Artisans can manage their own blocked dates"
  ON public.blocked_dates FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert sample availability for existing artisans
-- Chidi (Plumbing) - Available Monday-Friday 8AM-5PM
INSERT INTO public.availability_slots (artisan_id, day_of_week, start_time, end_time)
SELECT id, day, time::TIME, (time::TIME + INTERVAL '1 hour')::TIME
FROM public.artisans
CROSS JOIN generate_series(1, 5) AS day -- Monday to Friday
CROSS JOIN generate_series(8, 16) AS hour
CROSS JOIN LATERAL (SELECT (hour || ':00:00')::TEXT) AS time(time)
WHERE service_category = 'Plumbing'
LIMIT 45;

-- Amaka (Electrical) - Available Monday-Saturday 9AM-6PM
INSERT INTO public.availability_slots (artisan_id, day_of_week, start_time, end_time)
SELECT id, day, time::TIME, (time::TIME + INTERVAL '1 hour')::TIME
FROM public.artisans
CROSS JOIN generate_series(1, 6) AS day -- Monday to Saturday
CROSS JOIN generate_series(9, 17) AS hour
CROSS JOIN LATERAL (SELECT (hour || ':00:00')::TEXT) AS time(time)
WHERE service_category = 'Electrical'
LIMIT 54;

-- Tunde (Carpentry) - Available Tuesday-Saturday 10AM-7PM
INSERT INTO public.availability_slots (artisan_id, day_of_week, start_time, end_time)
SELECT id, day, time::TIME, (time::TIME + INTERVAL '1 hour')::TIME
FROM public.artisans
CROSS JOIN generate_series(2, 6) AS day -- Tuesday to Saturday
CROSS JOIN generate_series(10, 18) AS hour
CROSS JOIN LATERAL (SELECT (hour || ':00:00')::TEXT) AS time(time)
WHERE service_category = 'Carpentry'
LIMIT 45;

-- Create indexes for better performance
CREATE INDEX idx_availability_artisan ON public.availability_slots(artisan_id);
CREATE INDEX idx_availability_day ON public.availability_slots(day_of_week);
CREATE INDEX idx_blocked_dates_artisan ON public.blocked_dates(artisan_id);
CREATE INDEX idx_blocked_dates_date ON public.blocked_dates(blocked_date);

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
  p_artisan_id UUID,
  p_date DATE,
  p_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_is_blocked BOOLEAN;
  v_has_slot BOOLEAN;
  v_has_booking BOOLEAN;
BEGIN
  -- Get day of week (0 = Sunday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check if date is blocked
  SELECT EXISTS(
    SELECT 1 FROM public.blocked_dates
    WHERE artisan_id = p_artisan_id AND blocked_date = p_date
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Check if artisan has availability slot for this day/time
  SELECT EXISTS(
    SELECT 1 FROM public.availability_slots
    WHERE artisan_id = p_artisan_id
      AND day_of_week = v_day_of_week
      AND start_time <= p_time
      AND end_time > p_time
      AND is_available = true
  ) INTO v_has_slot;
  
  IF NOT v_has_slot THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there's already a booking for this time
  SELECT EXISTS(
    SELECT 1 FROM public.bookings
    WHERE artisan_id = p_artisan_id
      AND DATE(preferred_date::TIMESTAMP) = p_date
      AND DATE_PART('hour', preferred_date::TIMESTAMP) = DATE_PART('hour', p_time::TIME)
      AND status NOT IN ('cancelled', 'rejected')
  ) INTO v_has_booking;
  
  RETURN NOT v_has_booking;
END;
$$ LANGUAGE plpgsql;
