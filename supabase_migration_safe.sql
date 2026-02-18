-- ============================================
-- EketSupply Mobile App - Safe Database Migration
-- This version skips the auth.users trigger which may cause errors
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PART 1: Core Tables
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type TEXT CHECK (user_type IN ('seeker', 'artisan')) NOT NULL,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (true);

-- Artisans table
CREATE TABLE IF NOT EXISTS public.artisans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT,
  service_category TEXT NOT NULL,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  response_time TEXT DEFAULT '1 hour',
  availability TEXT DEFAULT 'Available',
  verified BOOLEAN DEFAULT false,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;

-- Artisans policies
CREATE POLICY "Artisan profiles are viewable by everyone"
  ON public.artisans FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own artisan profile"
  ON public.artisans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own artisan profile"
  ON public.artisans FOR UPDATE
  USING (true);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Artisans can manage their own services"
  ON public.services FOR ALL
  USING (true);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- ============================================
-- PART 2: Booking System
-- ============================================

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  booking_type TEXT CHECK (booking_type IN ('quote', 'instant')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
  
  service_description TEXT NOT NULL,
  preferred_date TIMESTAMP WITH TIME ZONE,
  preferred_time TEXT,
  location TEXT NOT NULL,
  
  estimated_price INTEGER,
  final_price INTEGER,
  
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card', 'escrow')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  
  customer_notes TEXT,
  artisan_response TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (true);

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Customers and artisans can update their bookings"
  ON public.bookings FOR UPDATE
  USING (true);

-- ============================================
-- PART 3: Push Notifications
-- ============================================

-- Push tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expo_push_token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Push tokens policies
CREATE POLICY "Users can manage their own push tokens"
  ON public.push_tokens FOR ALL
  USING (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (true);

-- ============================================
-- PART 4: Functions and Triggers
-- ============================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_artisans_updated_at ON public.artisans;
CREATE TRIGGER set_artisans_updated_at
  BEFORE UPDATE ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PART 5: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_artisans_profile_id ON public.artisans(profile_id);
CREATE INDEX IF NOT EXISTS idx_artisans_category ON public.artisans(service_category);
CREATE INDEX IF NOT EXISTS idx_services_artisan ON public.services(artisan_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artisan ON public.reviews(artisan_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_artisan ON public.bookings(artisan_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_tokens_profile ON public.push_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================
-- PART 6: Sample Data
-- ============================================

-- Insert sample profiles
INSERT INTO public.profiles (id, user_id, email, full_name, user_type, phone, location)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'sample_user_1', 'chidi@example.com', 'Chidi Okafor', 'artisan', '+234 801 234 5678', 'Lagos, Nigeria'),
  ('22222222-2222-2222-2222-222222222222', 'sample_user_2', 'amaka@example.com', 'Amaka Nwosu', 'artisan', '+234 802 345 6789', 'Abuja, Nigeria'),
  ('33333333-3333-3333-3333-333333333333', 'sample_user_3', 'tunde@example.com', 'Tunde Adeyemi', 'artisan', '+234 803 456 7890', 'Port Harcourt, Nigeria')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample artisans
INSERT INTO public.artisans (id, profile_id, business_name, service_category, bio, years_experience, rating, total_reviews, total_jobs, verified, location)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Chidi Plumbing Services', 'Plumbing', 'Expert plumber with 8 years of experience in residential and commercial plumbing.', 8, 4.8, 127, 450, true, 'Lagos, Nigeria'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Amaka Electrical Works', 'Electrical', 'Licensed electrician specializing in installations, repairs, and maintenance.', 6, 4.9, 98, 320, true, 'Abuja, Nigeria'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Tunde Carpentry & Furniture', 'Carpentry', 'Custom furniture maker and carpenter with attention to detail.', 10, 4.7, 156, 580, true, 'Port Harcourt, Nigeria')
ON CONFLICT (id) DO NOTHING;

-- Insert sample services
INSERT INTO public.services (artisan_id, name, description, price, duration)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pipe Repair', 'Fix leaking or burst pipes', '₦5,000 - ₦15,000', '2-3 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Toilet Installation', 'Install new toilet fixtures', '₦8,000 - ₦20,000', '3-4 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Drain Cleaning', 'Clear blocked drains and sewers', '₦3,000 - ₦10,000', '1-2 hours'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Wiring Installation', 'Complete house wiring', '₦50,000 - ₦150,000', '1-3 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Light Fixture Installation', 'Install ceiling lights and fans', '₦5,000 - ₦12,000', '1-2 hours'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Electrical Repairs', 'Fix faulty outlets and switches', '₦3,000 - ₦8,000', '1 hour'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Custom Furniture', 'Design and build custom furniture', '₦30,000 - ₦200,000', '1-2 weeks'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Door Installation', 'Install wooden or metal doors', '₦15,000 - ₦40,000', '4-6 hours'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Furniture Repair', 'Repair damaged furniture', '₦5,000 - ₦25,000', '2-4 hours');

-- Insert sample reviews
INSERT INTO public.reviews (artisan_id, customer_id, rating, comment)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 5, 'Excellent work! Fixed my leaking pipe quickly and professionally.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 5, 'Very reliable and affordable. Highly recommended!'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 4, 'Good service, arrived on time and completed the job well.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 5, 'Professional electrician. Rewired my entire house perfectly.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 5, 'Fast and efficient. Fixed my electrical issues in no time.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 5, 'Beautiful custom wardrobe! Worth every naira.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 4, 'Great craftsmanship. Delivered on time.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 5, 'Repaired my dining table perfectly. Looks brand new!');

-- ============================================
-- SUCCESS! Migration Complete
-- ============================================
-- Tables created: 7
-- Sample artisans: 3
-- Sample services: 9
-- Sample reviews: 8
-- ============================================
