-- ============================================
-- Video Testimonials, Badges, and Service Packages Migration
-- Add tables for video testimonials, artisan badges, and service packages
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- VIDEO TESTIMONIALS
-- ============================================

-- Create video_testimonials table
CREATE TABLE IF NOT EXISTS public.video_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for video testimonials
CREATE INDEX IF NOT EXISTS idx_video_testimonials_artisan ON public.video_testimonials(artisan_id);
CREATE INDEX IF NOT EXISTS idx_video_testimonials_customer ON public.video_testimonials(customer_id);
CREATE INDEX IF NOT EXISTS idx_video_testimonials_booking ON public.video_testimonials(booking_id);

-- Enable RLS for video_testimonials
ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_testimonials
CREATE POLICY "Anyone can view video testimonials"
  ON public.video_testimonials
  FOR SELECT
  USING (true);

CREATE POLICY "Customers can insert own video testimonials"
  ON public.video_testimonials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = customer_id
    )
  );

CREATE POLICY "Customers can delete own video testimonials"
  ON public.video_testimonials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = customer_id
    )
  );

-- Create storage bucket for video testimonials
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-testimonials', 'video-testimonials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for video testimonials
CREATE POLICY "Anyone can view video testimonials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'video-testimonials');

CREATE POLICY "Authenticated users can upload video testimonials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'video-testimonials' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own video testimonials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'video-testimonials' AND auth.role() = 'authenticated');

-- ============================================
-- ARTISAN BADGES
-- ============================================

-- Create badge_types enum
DO $$ BEGIN
  CREATE TYPE badge_type AS ENUM (
    'jobs_milestone_50',
    'jobs_milestone_100',
    'jobs_milestone_500',
    'rating_5_star',
    'rating_top_rated',
    'response_fast',
    'response_instant',
    'verified_pro',
    'customer_favorite',
    'quality_expert'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create artisan_badges table
CREATE TABLE IF NOT EXISTS public.artisan_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  badge_type badge_type NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artisan_id, badge_type)
);

-- Create indexes for artisan_badges
CREATE INDEX IF NOT EXISTS idx_artisan_badges_artisan ON public.artisan_badges(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_badges_type ON public.artisan_badges(badge_type);

-- Enable RLS for artisan_badges
ALTER TABLE public.artisan_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artisan_badges
CREATE POLICY "Anyone can view artisan badges"
  ON public.artisan_badges
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert badges"
  ON public.artisan_badges
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SERVICE PACKAGES
-- ============================================

-- Create service_packages table
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  package_name TEXT NOT NULL,
  description TEXT,
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package_services junction table
CREATE TABLE IF NOT EXISTS public.package_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES public.service_packages(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(package_id, service_id)
);

-- Create indexes for service packages
CREATE INDEX IF NOT EXISTS idx_service_packages_artisan ON public.service_packages(artisan_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_package_services_package ON public.package_services(package_id);
CREATE INDEX IF NOT EXISTS idx_package_services_service ON public.package_services(service_id);

-- Enable RLS for service_packages
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_packages
CREATE POLICY "Anyone can view active packages"
  ON public.service_packages
  FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.artisans a
    JOIN public.profiles p ON a.profile_id = p.id
    WHERE a.id = artisan_id
  ));

CREATE POLICY "Artisans can insert own packages"
  ON public.service_packages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

CREATE POLICY "Artisans can update own packages"
  ON public.service_packages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

CREATE POLICY "Artisans can delete own packages"
  ON public.service_packages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

-- Enable RLS for package_services
ALTER TABLE public.package_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for package_services
CREATE POLICY "Anyone can view package services"
  ON public.package_services
  FOR SELECT
  USING (true);

CREATE POLICY "Artisans can manage package services"
  ON public.package_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.service_packages sp
      JOIN public.artisans a ON sp.artisan_id = a.id
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE sp.id = package_id
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate and award badges
CREATE OR REPLACE FUNCTION calculate_artisan_badges(p_artisan_id UUID)
RETURNS void AS $$
DECLARE
  v_completed_jobs INTEGER;
  v_avg_rating DECIMAL(3, 2);
  v_avg_response_time INTEGER;
BEGIN
  -- Get completed jobs count
  SELECT COUNT(*) INTO v_completed_jobs
  FROM public.bookings
  WHERE artisan_id = p_artisan_id AND status = 'completed';

  -- Get average rating
  SELECT AVG(rating) INTO v_avg_rating
  FROM public.reviews
  WHERE artisan_id = p_artisan_id;

  -- Award jobs milestone badges
  IF v_completed_jobs >= 50 THEN
    INSERT INTO public.artisan_badges (artisan_id, badge_type)
    VALUES (p_artisan_id, 'jobs_milestone_50')
    ON CONFLICT (artisan_id, badge_type) DO NOTHING;
  END IF;

  IF v_completed_jobs >= 100 THEN
    INSERT INTO public.artisan_badges (artisan_id, badge_type)
    VALUES (p_artisan_id, 'jobs_milestone_100')
    ON CONFLICT (artisan_id, badge_type) DO NOTHING;
  END IF;

  IF v_completed_jobs >= 500 THEN
    INSERT INTO public.artisan_badges (artisan_id, badge_type)
    VALUES (p_artisan_id, 'jobs_milestone_500')
    ON CONFLICT (artisan_id, badge_type) DO NOTHING;
  END IF;

  -- Award rating badges
  IF v_avg_rating >= 5.0 AND v_completed_jobs >= 10 THEN
    INSERT INTO public.artisan_badges (artisan_id, badge_type)
    VALUES (p_artisan_id, 'rating_5_star')
    ON CONFLICT (artisan_id, badge_type) DO NOTHING;
  END IF;

  IF v_avg_rating >= 4.8 AND v_completed_jobs >= 50 THEN
    INSERT INTO public.artisan_badges (artisan_id, badge_type)
    VALUES (p_artisan_id, 'rating_top_rated')
    ON CONFLICT (artisan_id, badge_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;
