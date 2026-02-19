-- Migration for Badge Auto-Awarding, Video Thumbnails, and Package Analytics
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Badge Award Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS badge_award_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  milestone_value NUMERIC, -- e.g., 100 for jobs_milestone_100
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_badge_award_log_artisan ON badge_award_log(artisan_id);
CREATE INDEX idx_badge_award_log_awarded_at ON badge_award_log(awarded_at DESC);

-- =====================================================
-- 2. Add Thumbnail URL to Video Testimonials
-- =====================================================
ALTER TABLE video_testimonials 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS idx_video_testimonials_thumbnail ON video_testimonials(thumbnail_url);

-- =====================================================
-- 3. Package Bookings Table for Analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS package_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  discount_percentage INTEGER NOT NULL,
  booking_status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_package_bookings_package ON package_bookings(package_id);
CREATE INDEX idx_package_bookings_artisan ON package_bookings(artisan_id);
CREATE INDEX idx_package_bookings_status ON package_bookings(booking_status);
CREATE INDEX idx_package_bookings_booked_at ON package_bookings(booked_at DESC);

-- =====================================================
-- 4. Artisan Milestone Tracking View
-- =====================================================
CREATE OR REPLACE VIEW artisan_milestones AS
SELECT 
  a.id AS artisan_id,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') AS completed_jobs,
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(DISTINCT r.id) AS total_reviews,
  COALESCE(AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)) / 3600), 0) AS avg_response_hours
FROM artisans a
LEFT JOIN bookings b ON a.id = b.artisan_id
LEFT JOIN reviews r ON a.id = r.artisan_id
GROUP BY a.id;

-- =====================================================
-- 5. Package Analytics View
-- =====================================================
CREATE OR REPLACE VIEW package_analytics AS
SELECT 
  sp.id AS package_id,
  sp.artisan_id,
  sp.package_name,
  sp.discount_percentage,
  COUNT(pb.id) AS total_bookings,
  COUNT(pb.id) FILTER (WHERE pb.booking_status = 'completed') AS completed_bookings,
  COUNT(pb.id) FILTER (WHERE pb.booking_status = 'cancelled') AS cancelled_bookings,
  COALESCE(SUM(pb.package_price) FILTER (WHERE pb.booking_status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(pb.discount_amount) FILTER (WHERE pb.booking_status = 'completed'), 0) AS total_savings_given,
  COALESCE(AVG(pb.package_price), 0) AS avg_package_price,
  CASE 
    WHEN COUNT(pb.id) > 0 THEN 
      (COUNT(pb.id) FILTER (WHERE pb.booking_status = 'completed')::FLOAT / COUNT(pb.id)::FLOAT * 100)
    ELSE 0 
  END AS completion_rate
FROM service_packages sp
LEFT JOIN package_bookings pb ON sp.id = pb.package_id
WHERE sp.is_active = TRUE
GROUP BY sp.id, sp.artisan_id, sp.package_name, sp.discount_percentage;

-- =====================================================
-- 6. Row Level Security (RLS) Policies
-- =====================================================

-- Badge Award Log RLS
ALTER TABLE badge_award_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans can view their own badge awards"
  ON badge_award_log FOR SELECT
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "System can insert badge awards"
  ON badge_award_log FOR INSERT
  WITH CHECK (true);

-- Package Bookings RLS
ALTER TABLE package_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own package bookings"
  ON package_bookings FOR SELECT
  USING (
    customer_id = auth.uid() OR
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create package bookings"
  ON package_bookings FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
  );

CREATE POLICY "Artisans can update their package bookings"
  ON package_bookings FOR UPDATE
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- =====================================================
-- 7. Functions for Badge Auto-Awarding
-- =====================================================

-- Function to check and award badges for an artisan
CREATE OR REPLACE FUNCTION check_and_award_badges(p_artisan_id UUID)
RETURNS TABLE(badge_type TEXT, newly_awarded BOOLEAN) AS $$
DECLARE
  v_completed_jobs INTEGER;
  v_average_rating NUMERIC;
  v_total_reviews INTEGER;
  v_badge_exists BOOLEAN;
BEGIN
  -- Get artisan milestones
  SELECT 
    completed_jobs, 
    average_rating, 
    total_reviews
  INTO 
    v_completed_jobs, 
    v_average_rating, 
    v_total_reviews
  FROM artisan_milestones
  WHERE artisan_id = p_artisan_id;

  -- Check and award jobs milestone badges
  IF v_completed_jobs >= 500 THEN
    SELECT EXISTS(SELECT 1 FROM artisan_badges WHERE artisan_id = p_artisan_id AND badge_type = 'jobs_milestone_500') INTO v_badge_exists;
    IF NOT v_badge_exists THEN
      INSERT INTO artisan_badges (artisan_id, badge_type, earned_at) VALUES (p_artisan_id, 'jobs_milestone_500', NOW());
      INSERT INTO badge_award_log (artisan_id, badge_type, milestone_value) VALUES (p_artisan_id, 'jobs_milestone_500', v_completed_jobs);
      RETURN QUERY SELECT 'jobs_milestone_500'::TEXT, TRUE;
    END IF;
  ELSIF v_completed_jobs >= 100 THEN
    SELECT EXISTS(SELECT 1 FROM artisan_badges WHERE artisan_id = p_artisan_id AND badge_type = 'jobs_milestone_100') INTO v_badge_exists;
    IF NOT v_badge_exists THEN
      INSERT INTO artisan_badges (artisan_id, badge_type, earned_at) VALUES (p_artisan_id, 'jobs_milestone_100', NOW());
      INSERT INTO badge_award_log (artisan_id, badge_type, milestone_value) VALUES (p_artisan_id, 'jobs_milestone_100', v_completed_jobs);
      RETURN QUERY SELECT 'jobs_milestone_100'::TEXT, TRUE;
    END IF;
  ELSIF v_completed_jobs >= 50 THEN
    SELECT EXISTS(SELECT 1 FROM artisan_badges WHERE artisan_id = p_artisan_id AND badge_type = 'jobs_milestone_50') INTO v_badge_exists;
    IF NOT v_badge_exists THEN
      INSERT INTO artisan_badges (artisan_id, badge_type, earned_at) VALUES (p_artisan_id, 'jobs_milestone_50', NOW());
      INSERT INTO badge_award_log (artisan_id, badge_type, milestone_value) VALUES (p_artisan_id, 'jobs_milestone_50', v_completed_jobs);
      RETURN QUERY SELECT 'jobs_milestone_50'::TEXT, TRUE;
    END IF;
  END IF;

  -- Check and award rating badges
  IF v_average_rating = 5.0 AND v_total_reviews >= 10 THEN
    SELECT EXISTS(SELECT 1 FROM artisan_badges WHERE artisan_id = p_artisan_id AND badge_type = 'rating_5_star') INTO v_badge_exists;
    IF NOT v_badge_exists THEN
      INSERT INTO artisan_badges (artisan_id, badge_type, earned_at) VALUES (p_artisan_id, 'rating_5_star', NOW());
      INSERT INTO badge_award_log (artisan_id, badge_type, milestone_value) VALUES (p_artisan_id, 'rating_5_star', v_average_rating);
      RETURN QUERY SELECT 'rating_5_star'::TEXT, TRUE;
    END IF;
  ELSIF v_average_rating >= 4.8 AND v_total_reviews >= 50 THEN
    SELECT EXISTS(SELECT 1 FROM artisan_badges WHERE artisan_id = p_artisan_id AND badge_type = 'rating_top_rated') INTO v_badge_exists;
    IF NOT v_badge_exists THEN
      INSERT INTO artisan_badges (artisan_id, badge_type, earned_at) VALUES (p_artisan_id, 'rating_top_rated', NOW());
      INSERT INTO badge_award_log (artisan_id, badge_type, milestone_value) VALUES (p_artisan_id, 'rating_top_rated', v_average_rating);
      RETURN QUERY SELECT 'rating_top_rated'::TEXT, TRUE;
    END IF;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Triggers for Automatic Badge Checking
-- =====================================================

-- Trigger to check badges after booking completion
CREATE OR REPLACE FUNCTION trigger_check_badges_after_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM check_and_award_badges(NEW.artisan_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_badges_after_booking ON bookings;
CREATE TRIGGER check_badges_after_booking
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges_after_booking();

-- Trigger to check badges after review submission
CREATE OR REPLACE FUNCTION trigger_check_badges_after_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.artisan_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_badges_after_review ON reviews;
CREATE TRIGGER check_badges_after_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges_after_review();

-- =====================================================
-- Migration Complete
-- =====================================================
-- This migration adds:
-- 1. Badge award logging and auto-awarding system
-- 2. Video thumbnail support
-- 3. Package booking tracking and analytics
-- 4. Database triggers for automatic badge awards
-- 5. Analytics views for insights
