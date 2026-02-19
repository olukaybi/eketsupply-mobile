-- Migration for Artisan Verification, Referral Program, and Smart Scheduling
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Artisan Verification System
-- =====================================================

-- Verification documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'id_card', 'certification', 'license', 'other'
  document_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_documents_artisan ON verification_documents(artisan_id);
CREATE INDEX idx_verification_documents_type ON verification_documents(document_type);

-- Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_artisan ON verification_requests(artisan_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_submitted ON verification_requests(submitted_at DESC);

-- Add verified status to artisans table
ALTER TABLE artisans 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_artisans_verified ON artisans(is_verified);

-- =====================================================
-- 2. Referral Program
-- =====================================================

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  total_uses INTEGER DEFAULT 0,
  max_uses INTEGER, -- NULL for unlimited
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_artisan ON referral_codes(artisan_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_active ON referral_codes(is_active);

-- Referral rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  referrer_reward_amount NUMERIC(10, 2) DEFAULT 5000, -- ₦5,000 for referrer
  referee_reward_amount NUMERIC(10, 2) DEFAULT 3000, -- ₦3,000 for referee
  referrer_reward_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  referee_reward_status TEXT DEFAULT 'pending',
  referee_first_job_completed BOOLEAN DEFAULT FALSE,
  referrer_paid_at TIMESTAMP WITH TIME ZONE,
  referee_paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referee ON referral_rewards(referee_id);
CREATE INDEX idx_referral_rewards_code ON referral_rewards(referral_code);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(referrer_reward_status, referee_reward_status);

-- =====================================================
-- 3. Smart Scheduling
-- =====================================================

-- Booking patterns table for analysis
CREATE TABLE IF NOT EXISTS booking_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  hour_of_day INTEGER NOT NULL, -- 0-23
  booking_count INTEGER DEFAULT 0,
  acceptance_count INTEGER DEFAULT 0,
  acceptance_rate NUMERIC(5, 2) DEFAULT 0,
  avg_response_time_hours NUMERIC(10, 2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booking_patterns_artisan ON booking_patterns(artisan_id);
CREATE INDEX idx_booking_patterns_day_hour ON booking_patterns(day_of_week, hour_of_day);
CREATE INDEX idx_booking_patterns_acceptance ON booking_patterns(acceptance_rate DESC);

-- Scheduling suggestions log
CREATE TABLE IF NOT EXISTS scheduling_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggested_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  confidence_score NUMERIC(5, 2), -- 0-100
  reasoning TEXT,
  was_accepted BOOLEAN,
  was_shown BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduling_suggestions_booking ON scheduling_suggestions(booking_id);
CREATE INDEX idx_scheduling_suggestions_artisan ON scheduling_suggestions(artisan_id);
CREATE INDEX idx_scheduling_suggestions_accepted ON scheduling_suggestions(was_accepted);

-- =====================================================
-- 4. Row Level Security (RLS) Policies
-- =====================================================

-- Verification Documents RLS
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans can view their own documents"
  ON verification_documents FOR SELECT
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Artisans can upload their own documents"
  ON verification_documents FOR INSERT
  WITH CHECK (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- Verification Requests RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans can view their own verification requests"
  ON verification_requests FOR SELECT
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Artisans can create verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- Referral Codes RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans can view their own referral codes"
  ON referral_codes FOR SELECT
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "System can create referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (true);

-- Referral Rewards RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referral rewards"
  ON referral_rewards FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    ) OR
    referee_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- Booking Patterns RLS
ALTER TABLE booking_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans can view their own booking patterns"
  ON booking_patterns FOR SELECT
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- Scheduling Suggestions RLS
ALTER TABLE scheduling_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their scheduling suggestions"
  ON scheduling_suggestions FOR SELECT
  USING (
    customer_id = auth.uid() OR
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- =====================================================
-- 5. Functions for Referral Code Generation
-- =====================================================

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Functions for Smart Scheduling
-- =====================================================

-- Update booking patterns after booking
CREATE OR REPLACE FUNCTION update_booking_patterns()
RETURNS TRIGGER AS $$
DECLARE
  v_day_of_week INTEGER;
  v_hour_of_day INTEGER;
  v_was_accepted BOOLEAN;
BEGIN
  -- Extract day and hour from booking
  v_day_of_week := EXTRACT(DOW FROM NEW.booking_date);
  v_hour_of_day := EXTRACT(HOUR FROM NEW.booking_time);
  v_was_accepted := (NEW.status = 'confirmed' OR NEW.status = 'completed');

  -- Insert or update booking pattern
  INSERT INTO booking_patterns (
    artisan_id,
    day_of_week,
    hour_of_day,
    booking_count,
    acceptance_count,
    last_updated
  ) VALUES (
    NEW.artisan_id,
    v_day_of_week,
    v_hour_of_day,
    1,
    CASE WHEN v_was_accepted THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (artisan_id, day_of_week, hour_of_day)
  DO UPDATE SET
    booking_count = booking_patterns.booking_count + 1,
    acceptance_count = booking_patterns.acceptance_count + CASE WHEN v_was_accepted THEN 1 ELSE 0 END,
    acceptance_rate = (booking_patterns.acceptance_count + CASE WHEN v_was_accepted THEN 1 ELSE 0 END)::NUMERIC / (booking_patterns.booking_count + 1) * 100,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for booking patterns
ALTER TABLE booking_patterns 
ADD CONSTRAINT unique_artisan_day_hour UNIQUE (artisan_id, day_of_week, hour_of_day);

-- Trigger to update booking patterns
DROP TRIGGER IF EXISTS update_booking_patterns_trigger ON bookings;
CREATE TRIGGER update_booking_patterns_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_patterns();

-- =====================================================
-- 7. Functions for Verification Workflow
-- =====================================================

-- Approve verification request
CREATE OR REPLACE FUNCTION approve_verification(
  p_request_id UUID,
  p_reviewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_artisan_id UUID;
BEGIN
  -- Get artisan ID from request
  SELECT artisan_id INTO v_artisan_id
  FROM verification_requests
  WHERE id = p_request_id;

  -- Update verification request
  UPDATE verification_requests
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_reviewer_id,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Update artisan verified status
  UPDATE artisans
  SET 
    is_verified = TRUE,
    verified_at = NOW()
  WHERE id = v_artisan_id;

  -- Award verified badge
  INSERT INTO artisan_badges (artisan_id, badge_type, earned_at)
  VALUES (v_artisan_id, 'verified_pro', NOW())
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Views for Analytics
-- =====================================================

-- Referral statistics view
CREATE OR REPLACE VIEW referral_statistics AS
SELECT 
  a.id AS artisan_id,
  rc.code AS referral_code,
  rc.total_uses,
  COUNT(rr.id) AS total_referrals,
  COUNT(rr.id) FILTER (WHERE rr.referee_first_job_completed = TRUE) AS successful_referrals,
  COALESCE(SUM(rr.referrer_reward_amount) FILTER (WHERE rr.referrer_reward_status = 'paid'), 0) AS total_earnings,
  COALESCE(SUM(rr.referrer_reward_amount) FILTER (WHERE rr.referrer_reward_status = 'pending'), 0) AS pending_earnings
FROM artisans a
LEFT JOIN referral_codes rc ON a.id = rc.artisan_id AND rc.is_active = TRUE
LEFT JOIN referral_rewards rr ON a.id = rr.referrer_id
GROUP BY a.id, rc.code, rc.total_uses;

-- =====================================================
-- Migration Complete
-- =====================================================
-- This migration adds:
-- 1. Artisan verification workflow with document upload and admin review
-- 2. Referral program with unique codes and reward tracking
-- 3. Smart scheduling with pattern analysis and suggestions
-- 4. Database triggers for automation
-- 5. Analytics views for insights
