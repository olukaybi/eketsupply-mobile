-- EketSupply Mobile App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('seeker', 'artisan')) NOT NULL DEFAULT 'seeker',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artisans table
CREATE TABLE IF NOT EXISTS public.artisans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  service_category TEXT NOT NULL,
  bio TEXT,
  location TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  response_time TEXT DEFAULT 'Within 24 hours',
  availability TEXT DEFAULT 'Mon-Fri, 9AM-5PM',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_min INTEGER NOT NULL,
  price_max INTEGER NOT NULL,
  duration TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Artisans policies
CREATE POLICY "Artisan profiles are viewable by everyone"
  ON public.artisans FOR SELECT
  USING (true);

CREATE POLICY "Artisans can insert their own profile"
  ON public.artisans FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = artisans.profile_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Artisans can update their own profile"
  ON public.artisans FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = artisans.profile_id
    AND profiles.user_id = auth.uid()
  ));

-- Services policies
CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Artisans can manage their own services"
  ON public.services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.artisans
    WHERE artisans.id = services.artisan_id
    AND artisans.profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_artisans_updated_at
  BEFORE UPDATE ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data
INSERT INTO public.profiles (user_id, full_name, email, phone, user_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Chidi Okafor', 'chidi@example.com', '+234 801 234 5678', 'artisan'),
  ('00000000-0000-0000-0000-000000000002', 'Amaka Nwosu', 'amaka@example.com', '+234 802 345 6789', 'artisan'),
  ('00000000-0000-0000-0000-000000000003', 'Tunde Adeyemi', 'tunde@example.com', '+234 803 456 7890', 'artisan')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.artisans (profile_id, service_category, bio, location, rating, total_reviews, completed_jobs, response_time, availability, verified) VALUES
  (
    (SELECT id FROM public.profiles WHERE email = 'chidi@example.com'),
    'Plumbing',
    'Professional plumber with 10+ years of experience. Specializing in residential and commercial plumbing services. Licensed and insured.',
    'Lagos, Nigeria',
    4.8,
    127,
    245,
    'Within 2 hours',
    'Mon-Sat, 8AM-6PM',
    TRUE
  ),
  (
    (SELECT id FROM public.profiles WHERE email = 'amaka@example.com'),
    'Electrical',
    'Certified electrician providing quality electrical installations and repairs. Expert in home automation and solar systems.',
    'Abuja, Nigeria',
    4.9,
    203,
    312,
    'Within 1 hour',
    'Mon-Sun, 7AM-8PM',
    TRUE
  ),
  (
    (SELECT id FROM public.profiles WHERE email = 'tunde@example.com'),
    'Carpentry',
    'Master carpenter specializing in custom furniture and woodwork. Quality craftsmanship guaranteed.',
    'Ibadan, Nigeria',
    4.7,
    156,
    189,
    'Within 3 hours',
    'Mon-Fri, 9AM-5PM',
    TRUE
  )
ON CONFLICT (profile_id) DO NOTHING;

-- Insert sample services
INSERT INTO public.services (artisan_id, name, description, price_min, price_max, duration) VALUES
  (
    (SELECT id FROM public.artisans WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'chidi@example.com')),
    'Pipe Repair',
    'Fix leaking or broken pipes',
    5000,
    10000,
    '2-3 hours'
  ),
  (
    (SELECT id FROM public.artisans WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'chidi@example.com')),
    'Toilet Installation',
    'Install new toilet fixtures',
    8000,
    15000,
    '3-4 hours'
  ),
  (
    (SELECT id FROM public.artisans WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'amaka@example.com')),
    'Wiring Installation',
    'Complete home wiring services',
    15000,
    30000,
    '1-2 days'
  ),
  (
    (SELECT id FROM public.artisans WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'tunde@example.com')),
    'Custom Furniture',
    'Build custom wooden furniture',
    20000,
    50000,
    '1-2 weeks'
  )
ON CONFLICT DO NOTHING;

-- Insert sample reviews
INSERT INTO public.reviews (artisan_id, reviewer_id, reviewer_name, rating, comment) VALUES
  (
    (SELECT id FROM public.artisans WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'chidi@example.com')),
    (SELECT id FROM public.profiles WHERE email = 'chidi@example.com'),
    'Ngozi Eze',
    5,
    'Excellent work! Very professional and completed the job on time. Highly recommended!'
  ),
  (
    (SELECT id FROM public.artisans WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'chidi@example.com')),
    (SELECT id FROM public.profiles WHERE email = 'chidi@example.com'),
    'Emeka Johnson',
    4,
    'Good service, but took a bit longer than expected. Overall satisfied with the quality.'
  ),
  (
    (SELECT id FROM public.artisans WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'amaka@example.com')),
    (SELECT id FROM public.profiles WHERE email = 'amaka@example.com'),
    'Fatima Bello',
    5,
    'Amazing craftsmanship! Will definitely hire again for future projects.'
  )
ON CONFLICT DO NOTHING;
