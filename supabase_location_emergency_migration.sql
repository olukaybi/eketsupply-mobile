-- Location-Based Discovery, Response Time Tracking, and Emergency Booking Migration
-- Run this migration in your Supabase SQL editor

-- ============================================================================
-- 1. ADD LOCATION COLUMNS TO ARTISANS TABLE
-- ============================================================================

ALTER TABLE artisans 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_artisans_location ON artisans(latitude, longitude);

COMMENT ON COLUMN artisans.latitude IS 'Artisan location latitude for map display and distance calculations';
COMMENT ON COLUMN artisans.longitude IS 'Artisan location longitude for map display and distance calculations';

-- ============================================================================
-- 2. RESPONSE TIME TRACKING TABLE
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
COMMENT ON COLUMN response_times.response_duration_minutes IS 'Minutes between request and response';

-- ============================================================================
-- 3. EMERGENCY BOOKINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  required_by TIMESTAMPTZ NOT NULL, -- Must be completed within 2 hours
  urgency_level VARCHAR(20) DEFAULT 'urgent' CHECK (urgency_level IN ('urgent', 'critical')),
  premium_multiplier DECIMAL(3, 2) DEFAULT 1.5, -- 1.5x normal price
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
COMMENT ON COLUMN emergency_bookings.premium_multiplier IS 'Price multiplier for emergency service (e.g., 1.5 = 50% premium)';

-- ============================================================================
-- 4. ARTISAN AVERAGE RESPONSE TIME VIEW
-- ============================================================================

CREATE OR REPLACE VIEW artisan_response_stats AS
SELECT 
  a.id AS artisan_id,
  a.name AS artisan_name,
  COUNT(rt.id) AS total_responses,
  AVG(rt.response_duration_minutes) AS avg_response_minutes,
  MIN(rt.response_duration_minutes) AS fastest_response_minutes,
  MAX(rt.response_duration_minutes) AS slowest_response_minutes,
  CASE 
    WHEN AVG(rt.response_duration_minutes) <= 60 THEN 'fast' -- < 1 hour
    WHEN AVG(rt.response_duration_minutes) <= 1440 THEN 'moderate' -- < 24 hours
    ELSE 'slow'
  END AS response_speed_category
FROM artisans a
LEFT JOIN response_times rt ON a.id = rt.artisan_id
WHERE rt.response_time IS NOT NULL
GROUP BY a.id, a.name;

COMMENT ON VIEW artisan_response_stats IS 'Aggregated response time statistics per artisan';

-- ============================================================================
-- 5. DISTANCE CALCULATION FUNCTION
-- ============================================================================

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

COMMENT ON FUNCTION calculate_distance IS 'Haversine formula to calculate distance between two coordinates in kilometers';

-- ============================================================================
-- 6. FIND NEARBY ARTISANS FUNCTION
-- ============================================================================

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

COMMENT ON FUNCTION find_nearby_artisans IS 'Find verified artisans within specified radius with distance and response time';

-- ============================================================================
-- 7. RECORD RESPONSE TIME FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION record_response_time(
  p_booking_id UUID,
  p_artisan_id UUID
) RETURNS VOID AS $$
DECLARE
  v_request_time TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  -- Get the request time (booking created_at)
  SELECT created_at INTO v_request_time
  FROM bookings
  WHERE id = p_booking_id;
  
  -- Calculate duration in minutes
  v_duration := EXTRACT(EPOCH FROM (NOW() - v_request_time)) / 60;
  
  -- Insert or update response time
  INSERT INTO response_times (artisan_id, booking_id, request_time, response_time, response_duration_minutes)
  VALUES (p_artisan_id, p_booking_id, v_request_time, NOW(), v_duration)
  ON CONFLICT (booking_id) 
  DO UPDATE SET 
    response_time = NOW(),
    response_duration_minutes = v_duration;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_response_time IS 'Records response time when artisan responds to booking';

-- ============================================================================
-- 8. FIND AVAILABLE EMERGENCY ARTISANS FUNCTION
-- ============================================================================

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
    -- Prefer artisans with fast response times
  ORDER BY 
    COALESCE(ars.avg_response_minutes, 999999) ASC,
    distance_km ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_emergency_artisans IS 'Find best artisans for emergency booking sorted by response time and distance';

-- ============================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Response times policies
ALTER TABLE response_times ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "System can insert response times"
  ON response_times FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update response times"
  ON response_times FOR UPDATE
  USING (true);

-- Emergency bookings policies
ALTER TABLE emergency_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their emergency bookings"
  ON emergency_bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Users can create emergency bookings"
  ON emergency_bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their emergency bookings"
  ON emergency_bookings FOR UPDATE
  USING (customer_id = auth.uid());

-- ============================================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Update some artisans with Lagos coordinates for testing
-- Lagos coordinates: approximately 6.5244° N, 3.3792° E

-- Example: Update first 5 artisans with random Lagos area coordinates
-- Uncomment to use:
/*
UPDATE artisans 
SET 
  latitude = 6.5244 + (random() * 0.1 - 0.05),
  longitude = 3.3792 + (random() * 0.1 - 0.05),
  location_updated_at = NOW()
WHERE id IN (SELECT id FROM artisans LIMIT 5);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
SELECT 'Migration completed successfully!' AS status;
SELECT 'Created tables: response_times, emergency_bookings' AS tables;
SELECT 'Created views: artisan_response_stats' AS views;
SELECT 'Created functions: calculate_distance, find_nearby_artisans, record_response_time, find_emergency_artisans' AS functions;
