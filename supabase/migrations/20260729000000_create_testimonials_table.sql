-- Create testimonials table for user testimonials/reviews
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  user_title TEXT,
  user_avatar_url TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  rating SMALLINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Allow public to view testimonials
CREATE POLICY "testimonials_select_all" ON public.testimonials
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert testimonials (can be restricted to admins later)
CREATE POLICY "testimonials_insert_authenticated" ON public.testimonials
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create storage buckets for testimonials
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('testimonials-videos', 'testimonials-videos', true),
  ('testimonials-thumbnails', 'testimonials-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read from testimonials buckets
CREATE POLICY "public_read_testimonials_videos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'testimonials-videos');

CREATE POLICY "public_read_testimonials_thumbnails" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'testimonials-thumbnails');

-- Allow authenticated users to upload to testimonials buckets
CREATE POLICY "authenticated_upload_testimonials_videos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'testimonials-videos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "authenticated_upload_testimonials_thumbnails" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'testimonials-thumbnails'
    AND auth.role() = 'authenticated'
  );
