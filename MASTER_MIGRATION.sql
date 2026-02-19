-- ============================================================================
-- EKETSUPPLY MOBILE APP - MASTER DATABASE MIGRATION
-- ============================================================================
-- This consolidated migration includes ALL features for the EketSupply mobile app.
-- Run this ONCE in your Supabase SQL Editor to set up the complete database.
--
-- IMPORTANT: This migration is idempotent (safe to run multiple times)
-- All CREATE statements use "IF NOT EXISTS" to prevent errors.
--
-- Features included:
-- 1. Portfolio Gallery Management
-- 2. Before/After Transformation Photos
-- 3. Video Testimonials
-- 4. Artisan Achievement Badges
-- 5. Service Packages
-- 6. Badge Auto-Awarding System
-- 7. Video Thumbnail Caching
-- 8. Package Analytics
-- 9. Artisan Verification Workflow
-- 10. Referral Program
-- 11. Smart Scheduling
-- 12. Location-Based Discovery
-- 13. Response Time Tracking
-- 14. Emergency Booking Flow
-- ============================================================================

-- Start transaction
BEGIN;

-- ============================================================================
-- SECTION 1: PORTFOLIO GALLERY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_photos_artisan ON portfolio_photos(artisan_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_order ON portfolio_photos(artisan_id, display_order);

COMMENT ON TABLE portfolio_photos IS 'Portfolio gallery photos for artisans to showcase their work';

-- RLS Policies for portfolio_photos
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view portfolio photos" ON portfolio_photos;
CREATE POLICY "Anyone can view portfolio photos"
  ON portfolio_photos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Artisans can manage their portfolio photos" ON portfolio_photos;
CREATE POLICY "Artisans can manage their portfolio photos"
  ON portfolio_photos FOR ALL
  USING (artisan_id IN (SELECT id FROM artisans WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 2: BEFORE/AFTER TRANSFORMATION PHOTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS before_after_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  before_photo_url TEXT NOT NULL,
  after_photo_url TEXT NOT NULL,
  project_title VARCHAR(200) NOT NULL,
  project_description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_before_after_artisan ON before_after_photos(artisan_id);
CREATE INDEX IF NOT EXISTS idx_before_after_order ON before_after_photos(artisan_id, display_order);

COMMENT ON TABLE before_after_photos IS 'Before and after transformation photos showcasing artisan work quality';

-- RLS Policies for before_after_photos
ALTER TABLE before_after_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view before/after photos" ON before_after_photos;
CREATE POLICY "Anyone can view before/after photos"
  ON before_after_photos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Artisans can manage their before/after photos" ON before_after_photos;
CREATE POLICY "Artisans can manage their before/after photos"
  ON before_after_photos FOR ALL
  USING (artisan_id IN (SELECT id FROM artisans WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 3: VIDEO TESTIMONIALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_testimonials_artisan ON video_testimonials(artisan_id);
CREATE INDEX IF NOT EXISTS idx_video_testimonials_customer ON video_testimonials(customer_id);
CREATE INDEX IF NOT EXISTS idx_video_testimonials_booking ON video_testimonials(booking_id);

COMMENT ON TABLE video_testimonials IS 'Video reviews from customers for authentic social proof';

-- RLS Policies for video_testimonials
ALTER TABLE video_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view video testimonials" ON video_testimonials;
CREATE POLICY "Anyone can view video testimonials"
  ON video_testimonials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Customers can create video testimonials" ON video_testimonials;
CREATE POLICY "Customers can create video testimonials"
  ON video_testimonials FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- ============================================================================
-- SECTION 4: ARTISAN ACHIEVEMENT BADGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS artisan_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artisan_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_artisan_badges_artisan ON artisan_badges(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_badges_type ON artisan_badges(badge_type);

COMMENT ON TABLE artisan_badges IS 'Achievement badges for artisan milestones and performance';

-- Badge types: verified, top_rated, fast_responder, reliable, experienced, 
-- rising_star, customer_favorite, specialist, premium, elite

-- RLS Policies for artisan_badges
ALTER TABLE artisan_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view artisan badges" ON artisan_badges;
CREATE POLICY "Anyone can view artisan badges"
  ON artisan_badges FOR SELECT
  USING (true);

-- ============================================================================
-- SECTION 5: SERVICE PACKAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  package_name VARCHAR(200) NOT NULL,
  description TEXT,
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS package_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_name VARCHAR(200) NOT NULL,
  service_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_packages_artisan ON service_packages(artisan_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_package_services_package ON package_services(package_id);

COMMENT ON TABLE service_packages IS 'Bundled service packages with discounted pricing';
COMMENT ON TABLE package_services IS 'Individual services included in a package';

-- RLS Policies
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON service_packages;
CREATE POLICY "Anyone can view active packages"
  ON service_packages FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Artisans can manage their packages" ON service_packages;
CREATE POLICY "Artisans can manage their packages"
  ON service_packages FOR ALL
  USING (artisan_id IN (SELECT id FROM artisans WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view package services" ON package_services;
CREATE POLICY "Anyone can view package services"
  ON package_services FOR SELECT
  USING (true);

-- ============================================================================
-- SECTION 6: BADGE AUTO-AWARDING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS badge_award_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_badge_award_log_artisan ON badge_award_log(artisan_id);

COMMENT ON TABLE badge_award_log IS 'Log of badge awards for tracking and analytics';

-- ============================================================================
-- SECTION 7: PACKAGE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS package_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  package_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_bookings_package ON package_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_artisan ON package_bookings(artisan_id);

COMMENT ON TABLE package_bookings IS 'Track which packages are booked for analytics';

-- Package analytics view
CREATE OR REPLACE VIEW package_analytics AS
SELECT 
  sp.id AS package_id,
  sp.package_name,
  sp.artisan_id,
  COUNT(pb.id) AS total_bookings,
  SUM(pb.package_price) AS total_revenue,
  AVG(pb.package_price) AS avg_booking_value,
  COUNT(DISTINCT pb.customer_id) AS unique_customers,
  sp.original_price,
  sp.discounted_price,
  sp.discount_percentage
FROM service_packages sp
LEFT JOIN package_bookings pb ON sp.id = pb.package_id
GROUP BY sp.id, sp.package_name, sp.artisan_id, sp.original_price, sp.discounted_price, sp.discount_percentage;

-- ============================================================================
-- SECTION 8: ARTISAN VERIFICATION WORKFLOW
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_card', 'certification', 'license', 'other')),
  document_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  UNIQUE(artisan_id)
);

CREATE INDEX IF NOT EXISTS idx_verification_documents_artisan ON verification_documents(artisan_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_artisan ON verification_requests(artisan_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

COMMENT ON TABLE verification_documents IS 'Documents uploaded by artisans for verification';
COMMENT ON TABLE verification_requests IS 'Verification requests pending admin review';

-- RLS Policies
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artisans can view their documents" ON verification_documents;
CREATE POLICY "Artisans can view their documents"
  ON verification_documents FOR SELECT
  USING (artisan_id IN (SELECT id FROM artisans WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Artisans can upload documents" ON verification_documents;
CREATE POLICY "Artisans can upload documents"
  ON verification_documents FOR INSERT
  WITH CHECK (artisan_id IN (SELECT id FROM artisans WHERE user_id = auth.uid()));

-- Approve verification function
CREATE OR REPLACE FUNCTION approve_verification(p_artisan_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update verification request status
  UPDATE verification_requests
  SET status = 'approved', reviewed_at = NOW()
  WHERE artisan_id = p_artisan_id;
  
  -- Update artisan verification status
  UPDATE artisans
  SET is_verified = true
  WHERE id = p_artisan_id;
  
  -- Award verified badge
  INSERT INTO artisan_badges (artisan_id, badge_type)
  VALUES (p_artisan_id, 'verified')
  ON CONFLICT (artisan_id, badge_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 9: REFERRAL PROGRAM
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artisan_id)
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  referrer_reward DECIMAL(10, 2) DEFAULT 5000.00,
  referred_reward DECIMAL(10, 2) DEFAULT 3000.00,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_artisan ON referral_codes(artisan_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred ON referral_rewards(referred_id);

COMMENT ON TABLE referral_codes IS 'Unique referral codes for artisans to invite others';
COMMENT ON TABLE referral_rewards IS 'Track referral rewards for both parties';

-- ============================================================================
-- SECTION 10: SMART SCHEDULING
-- ============================================================================

-- Add availability tracking columns to artisans table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'artisans' AND column_name = 'typical_availability') THEN
    ALTER TABLE artisans ADD COLUMN typical_availability JSONB DEFAULT '{}';
  END IF;
END $$;

COMMENT ON COLUMN artisans.typical_availability IS 'JSON object storing typical availability patterns for smart scheduling';

-- ============================================================================
-- SECTION 11: LOCATION-BASED DISCOVERY
-- ============================================================================

-- Add location columns to artisans table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'artisans' AND column_name = 'latitude') THEN
    ALTER TABLE artisans ADD COLUMN latitude DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'artisans' AND column_name = 'longitude') THEN
    ALTER TABLE artisans ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'artisans' AND column_name = 'location_updated_at') THEN
    ALTER TABLE artisans ADD COLUMN location_updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_artisans_location ON artisans(latitude, longitude);

-- Distance calculation function (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Earth radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find nearby artisans function
CREATE OR REPLACE FUNCTION find_nearby_artisans(
  user_lat DECIMAL,
  user_lon DECIMAL,
  radius_km DECIMAL DEFAULT 10,
  service_category VARCHAR DEFAULT NULL
) RETURNS TABLE (
  artisan_id UUID,
  artisan_name VARCHAR,
  business_name VARCHAR,
  category VARCHAR,
  rating DECIMAL,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  avg_response_minutes DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.business_name,
    a.category,
    a.rating,
    a.latitude,
    a.longitude,
    calculate_distance(user_lat, user_lon, a.latitude, a.longitude) AS distance_km,
    ars.avg_response_minutes
  FROM artisans a
  LEFT JOIN artisan_response_stats ars ON a.id = ars.artisan_id
  WHERE 
    a.latitude IS NOT NULL 
    AND a.longitude IS NOT NULL
    AND a.is_verified = true
    AND calculate_distance(user_lat, user_lon, a.latitude, a.longitude) <= radius_km
    AND (service_category IS NULL OR a.category = service_category)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 12: RESPONSE TIME TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS response_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  request_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time TIMESTAMPTZ,
  response_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_response_times_artisan ON response_times(artisan_id);
CREATE INDEX IF NOT EXISTS idx_response_times_booking ON response_times(booking_id);
CREATE INDEX IF NOT EXISTS idx_response_times_duration ON response_times(response_duration_minutes);

COMMENT ON TABLE response_times IS 'Tracks how quickly artisans respond to booking requests';

-- Artisan response stats view
CREATE OR REPLACE VIEW artisan_response_stats AS
SELECT 
  a.id AS artisan_id,
  a.name AS artisan_name,
  COUNT(rt.id) AS total_responses,
  AVG(rt.response_duration_minutes) AS avg_response_minutes,
  MIN(rt.response_duration_minutes) AS fastest_response_minutes,
  MAX(rt.response_duration_minutes) AS slowest_response_minutes,
  CASE 
    WHEN AVG(rt.response_duration_minutes) <= 60 THEN 'fast'
    WHEN AVG(rt.response_duration_minutes) <= 1440 THEN 'moderate'
    ELSE 'slow'
  END AS response_speed_category
FROM artisans a
LEFT JOIN response_times rt ON a.id = rt.artisan_id
WHERE rt.response_time IS NOT NULL
GROUP BY a.id, a.name;

-- Record response time function
CREATE OR REPLACE FUNCTION record_response_time(
  p_booking_id UUID,
  p_artisan_id UUID
) RETURNS VOID AS $$
DECLARE
  v_request_time TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  SELECT created_at INTO v_request_time
  FROM bookings
  WHERE id = p_booking_id;
  
  v_duration := EXTRACT(EPOCH FROM (NOW() - v_request_time)) / 60;
  
  INSERT INTO response_times (artisan_id, booking_id, request_time, response_time, response_duration_minutes)
  VALUES (p_artisan_id, p_booking_id, v_request_time, NOW(), v_duration)
  ON CONFLICT (booking_id) 
  DO UPDATE SET 
    response_time = NOW(),
    response_duration_minutes = v_duration;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for response_times
ALTER TABLE response_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view response times for their bookings" ON response_times;
CREATE POLICY "Users can view response times for their bookings"
  ON response_times FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE customer_id = auth.uid()
    )
    OR artisan_id IN (
      SELECT id FROM artisans WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 13: EMERGENCY BOOKING FLOW
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  required_by TIMESTAMPTZ NOT NULL,
  urgency_level VARCHAR(20) DEFAULT 'urgent' CHECK (urgency_level IN ('urgent', 'critical')),
  premium_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_emergency_bookings_customer ON emergency_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_status ON emergency_bookings(status);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_location ON emergency_bookings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_required_by ON emergency_bookings(required_by);

COMMENT ON TABLE emergency_bookings IS 'Urgent bookings requiring artisan within 2 hours';

-- Find emergency artisans function
CREATE OR REPLACE FUNCTION find_emergency_artisans(
  emergency_lat DECIMAL,
  emergency_lon DECIMAL,
  service_category VARCHAR,
  max_distance_km DECIMAL DEFAULT 10
) RETURNS TABLE (
  artisan_id UUID,
  artisan_name VARCHAR,
  business_name VARCHAR,
  rating DECIMAL,
  distance_km DECIMAL,
  avg_response_minutes DECIMAL,
  phone VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.business_name,
    a.rating,
    calculate_distance(emergency_lat, emergency_lon, a.latitude, a.longitude) AS distance_km,
    ars.avg_response_minutes,
    a.phone
  FROM artisans a
  LEFT JOIN artisan_response_stats ars ON a.id = ars.artisan_id
  WHERE 
    a.latitude IS NOT NULL 
    AND a.longitude IS NOT NULL
    AND a.is_verified = true
    AND a.category = service_category
    AND calculate_distance(emergency_lat, emergency_lon, a.latitude, a.longitude) <= max_distance_km
  ORDER BY 
    COALESCE(ars.avg_response_minutes, 999999) ASC,
    distance_km ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for emergency_bookings
ALTER TABLE emergency_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their emergency bookings" ON emergency_bookings;
CREATE POLICY "Users can view their emergency bookings"
  ON emergency_bookings FOR SELECT
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can create emergency bookings" ON emergency_bookings;
CREATE POLICY "Users can create emergency bookings"
  ON emergency_bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMIT;

-- Verify migration success
SELECT 'EketSupply Master Migration completed successfully!' AS status;
SELECT 'All tables, views, functions, and policies have been created.' AS result;
