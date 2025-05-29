-- Fix storage bucket policies for question-images
-- This script updates the policies to allow proper access for image uploads

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access for question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access for question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access for question images" ON storage.objects;

-- Create new policies with proper permissions
CREATE POLICY "Public read access for question images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

CREATE POLICY "Allow all uploads to question images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Allow all updates to question images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'question-images')
WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Allow all deletes from question images"
ON storage.objects FOR DELETE
USING (bucket_id = 'question-images');

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  5242880,
  '{"image/png","image/jpeg","image/svg+xml"}'::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = '{"image/png","image/jpeg","image/svg+xml"}'::text[]; 