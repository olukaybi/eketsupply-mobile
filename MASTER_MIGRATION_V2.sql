-- ============================================================================
-- EKETSUPPLY MOBILE APP - MASTER DATABASE MIGRATION V2
-- ============================================================================
-- Fixed dependency order: Tables → Views → Functions → RLS Policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CREATE ALL TABLES
-- ============================================================================

-- Portfolio photos
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Before/after photos
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

-- Video testimonials
CREATE TABLE IF NOT EXISTS video_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artisan badges
CREATE TABLE IF NOT EXISTS artisan_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artisan_id, badge_type)
);

-- Service packages
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

-- Badge award log
CREATE TABLE IF NOT EXISTS badge_award_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_reason TEXT
);

-- Package bookings
CREATE TABLE IF NOT EXISTS package_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  package_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification documents
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

-- Referral codes
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

-- Response times
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

-- Emergency bookings
CREATE TABLE IF NOT EXISTS emergency_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Add location columns to artisans
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

-- ============================================================================
-- PART 2: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_portfolio_photos_artisan ON portfolio_photos(artisan_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_order ON portfolio_photos(artisan_id, display_order);
CREATE INDEX IF NOT EXISTS idx_before_after_artisan ON before_after_photos(artisan_id);
CREATE INDEX IF NOT EXISTS idx_before_after_order ON before_after_photos(artisan_id, display_order);
CREATE INDEX IF NOT EXISTS idx_video_testimonials_artisan ON video_testimonials(artisan_id);
CREATE INDEX IF NOT EXISTS idx_video_testimonials_customer ON video_testimonials(customer_id);
CREATE INDEX IF NOT EXISTS idx_video_testimonials_booking ON video_testimonials(booking_id);
CREATE INDEX IF NOT EXISTS idx_artisan_badges_artisan ON artisan_badges(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_badges_type ON artisan_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_service_packages_artisan ON service_packages(artisan_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_package_services_package ON package_services(package_id);
CREATE INDEX IF NOT EXISTS idx_badge_award_log_artisan ON badge_award_log(artisan_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_package ON package_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_artisan ON package_bookings(artisan_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_artisan ON verification_documents(artisan_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_artisan ON verification_requests(artisan_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_referral_codes_artisan ON referral_codes(artisan_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred ON referral_rewards(referred_id);
CREATE INDEX IF NOT EXISTS idx_artisans_location ON artisans(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_response_times_artisan ON response_times(artisan_id);
CREATE INDEX IF NOT EXISTS idx_response_times_booking ON response_times(booking_id);
CREATE INDEX IF NOT EXISTS idx_response_times_duration ON response_times(response_duration_minutes);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_customer ON emergency_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_status ON emergency_bookings(status);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_location ON emergency_bookings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_required_by ON emergency_bookings(required_by);

-- ============================================================================
-- PART 3: CREATE VIEWS
-- ============================================================================

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

-- Artisan response stats view
CREATE OR REPLACE VIEW artisan_response_stats AS
SELECT 
  a.id AS artisan_id,
  p.full_name AS artisan_name,
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
JOIN profiles p ON a.profile_id = p.id
LEFT JOIN response_times rt ON a.id = rt.artisan_id
WHERE rt.response_time IS NOT NULL
GROUP BY a.id, p.full_name;

-- ============================================================================
-- PART 4: CREATE FUNCTIONS
-- ============================================================================

-- Distance calculation function
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371;
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
  service_category TEXT DEFAULT NULL
) RETURNS TABLE (
  artisan_id UUID,
  artisan_name TEXT,
  business_name TEXT,
  category TEXT,
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
    p.full_name,
    a.business_name,
    a.service_category,
    a.rating,
    a.latitude,
    a.longitude,
    calculate_distance(user_lat, user_lon, a.latitude, a.longitude) AS distance_km,
    ars.avg_response_minutes
  FROM artisans a
  JOIN profiles p ON a.profile_id = p.id
  LEFT JOIN artisan_response_stats ars ON a.id = ars.artisan_id
  WHERE 
    a.latitude IS NOT NULL 
    AND a.longitude IS NOT NULL
    AND a.verified = true
    AND calculate_distance(user_lat, user_lon, a.latitude, a.longitude) <= radius_km
    AND (service_category IS NULL OR a.service_category = service_category)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Find emergency artisans function
CREATE OR REPLACE FUNCTION find_emergency_artisans(
  emergency_lat DECIMAL,
  emergency_lon DECIMAL,
  service_category TEXT,
  max_distance_km DECIMAL DEFAULT 10
) RETURNS TABLE (
  artisan_id UUID,
  artisan_name TEXT,
  business_name TEXT,
  rating DECIMAL,
  distance_km DECIMAL,
  avg_response_minutes DECIMAL,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    p.full_name,
    a.business_name,
    a.rating,
    calculate_distance(emergency_lat, emergency_lon, a.latitude, a.longitude) AS distance_km,
    ars.avg_response_minutes,
    p.phone
  FROM artisans a
  JOIN profiles p ON a.profile_id = p.id
  LEFT JOIN artisan_response_stats ars ON a.id = ars.artisan_id
  WHERE 
    a.latitude IS NOT NULL 
    AND a.longitude IS NOT NULL
    AND a.verified = true
    AND a.service_category = service_category
    AND calculate_distance(emergency_lat, emergency_lon, a.latitude, a.longitude) <= max_distance_km
  ORDER BY 
    COALESCE(ars.avg_response_minutes, 999999) ASC,
    distance_km ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

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

-- Approve verification function
CREATE OR REPLACE FUNCTION approve_verification(p_artisan_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE verification_requests
  SET status = 'approved', reviewed_at = NOW()
  WHERE artisan_id = p_artisan_id;
  
  UPDATE artisans
  SET verified = true
  WHERE id = p_artisan_id;
  
  INSERT INTO artisan_badges (artisan_id, badge_type)
  VALUES (p_artisan_id, 'verified')
  ON CONFLICT (artisan_id, badge_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Portfolio photos
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view portfolio photos" ON portfolio_photos;
CREATE POLICY "Anyone can view portfolio photos"
  ON portfolio_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artisans can manage their portfolio photos" ON portfolio_photos;
CREATE POLICY "Artisans can manage their portfolio photos"
  ON portfolio_photos FOR ALL
  USING (
    artisan_id IN (
      SELECT a.id FROM artisans a
      JOIN profiles p ON a.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

-- Before/after photos
ALTER TABLE before_after_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view before/after photos" ON before_after_photos;
CREATE POLICY "Anyone can view before/after photos"
  ON before_after_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artisans can manage their before/after photos" ON before_after_photos;
CREATE POLICY "Artisans can manage their before/after photos"
  ON before_after_photos FOR ALL
  USING (
    artisan_id IN (
      SELECT a.id FROM artisans a
      JOIN profiles p ON a.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

-- Video testimonials
ALTER TABLE video_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view video testimonials" ON video_testimonials;
CREATE POLICY "Anyone can view video testimonials"
  ON video_testimonials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers can create video testimonials" ON video_testimonials;
CREATE POLICY "Customers can create video testimonials"
  ON video_testimonials FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

-- Artisan badges
ALTER TABLE artisan_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view artisan badges" ON artisan_badges;
CREATE POLICY "Anyone can view artisan badges"
  ON artisan_badges FOR SELECT USING (true);

-- Service packages
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON service_packages;
CREATE POLICY "Anyone can view active packages"
  ON service_packages FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Artisans can manage their packages" ON service_packages;
CREATE POLICY "Artisans can manage their packages"
  ON service_packages FOR ALL
  USING (
    artisan_id IN (
      SELECT a.id FROM artisans a
      JOIN profiles p ON a.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Anyone can view package services" ON package_services;
CREATE POLICY "Anyone can view package services"
  ON package_services FOR SELECT USING (true);

-- Verification documents
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artisans can view their documents" ON verification_documents;
CREATE POLICY "Artisans can view their documents"
  ON verification_documents FOR SELECT
  USING (
    artisan_id IN (
      SELECT a.id FROM artisans a
      JOIN profiles p ON a.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Artisans can upload documents" ON verification_documents;
CREATE POLICY "Artisans can upload documents"
  ON verification_documents FOR INSERT
  WITH CHECK (
    artisan_id IN (
      SELECT a.id FROM artisans a
      JOIN profiles p ON a.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

-- Response times
ALTER TABLE response_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view response times for their bookings" ON response_times;
CREATE POLICY "Users can view response times for their bookings"
  ON response_times FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text)
    )
    OR artisan_id IN (
      SELECT a.id FROM artisans a
      JOIN profiles p ON a.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

-- Emergency bookings
ALTER TABLE emergency_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their emergency bookings" ON emergency_bookings;
CREATE POLICY "Users can view their emergency bookings"
  ON emergency_bookings FOR SELECT
  USING (customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can create emergency bookings" ON emergency_bookings;
CREATE POLICY "Users can create emergency bookings"
  ON emergency_bookings FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMIT;

SELECT 'EketSupply Master Migration V2 completed successfully!' AS status;
SELECT 'All tables, views, functions, and policies created in correct order.' AS result;
