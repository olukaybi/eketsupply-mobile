-- ============================================
-- Before/After Photos Migration
-- Add before_after_photos table for transformation showcases
-- Run this in Supabase SQL Editor
-- ============================================

-- Create before_after_photos table
CREATE TABLE IF NOT EXISTS public.before_after_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE NOT NULL,
  project_title TEXT NOT NULL,
  project_description TEXT,
  before_photo_url TEXT NOT NULL,
  after_photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_before_after_artisan_id ON public.before_after_photos(artisan_id);
CREATE INDEX IF NOT EXISTS idx_before_after_display_order ON public.before_after_photos(artisan_id, display_order);

-- Enable Row Level Security
ALTER TABLE public.before_after_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for before_after_photos

-- Allow everyone to view before/after photos
CREATE POLICY "Anyone can view before/after photos"
  ON public.before_after_photos
  FOR SELECT
  USING (true);

-- Allow artisans to insert their own before/after photos
CREATE POLICY "Artisans can insert own before/after photos"
  ON public.before_after_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

-- Allow artisans to update their own before/after photos
CREATE POLICY "Artisans can update own before/after photos"
  ON public.before_after_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

-- Allow artisans to delete their own before/after photos
CREATE POLICY "Artisans can delete own before/after photos"
  ON public.before_after_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      JOIN public.profiles p ON a.profile_id = p.id
      WHERE a.id = artisan_id
    )
  );

-- Create storage bucket for before/after photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('before-after-photos', 'before-after-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for before/after photos bucket
CREATE POLICY "Anyone can view before/after photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'before-after-photos');

CREATE POLICY "Authenticated users can upload before/after photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'before-after-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own before/after photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'before-after-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own before/after photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'before-after-photos' AND auth.role() = 'authenticated');
