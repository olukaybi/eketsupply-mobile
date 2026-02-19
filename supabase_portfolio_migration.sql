-- ============================================
-- Portfolio Photos Migration
-- Add portfolio_photos table for artisan work galleries
-- Run this in Supabase SQL Editor
-- ============================================

-- Create portfolio_photos table
CREATE TABLE IF NOT EXISTS public.portfolio_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_artisan_id ON public.portfolio_photos(artisan_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_display_order ON public.portfolio_photos(artisan_id, display_order);

-- Enable Row Level Security
ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_photos

-- Allow everyone to view portfolio photos
CREATE POLICY "Anyone can view portfolio photos"
  ON public.portfolio_photos
  FOR SELECT
  USING (true);

-- Allow artisans to insert their own portfolio photos
CREATE POLICY "Artisans can insert own portfolio photos"
  ON public.portfolio_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

-- Allow artisans to update their own portfolio photos
CREATE POLICY "Artisans can update own portfolio photos"
  ON public.portfolio_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

-- Allow artisans to delete their own portfolio photos
CREATE POLICY "Artisans can delete own portfolio photos"
  ON public.portfolio_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

-- Create storage bucket for portfolio photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-photos', 'portfolio-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio photos bucket
CREATE POLICY "Anyone can view portfolio photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-photos');

CREATE POLICY "Authenticated users can upload portfolio photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own portfolio photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own portfolio photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio-photos' AND auth.role() = 'authenticated');
