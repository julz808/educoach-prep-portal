-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
);

-- Create storage policy for public read access
CREATE POLICY "Public read access for question images" ON storage.objects
FOR SELECT USING (bucket_id = 'question-images');

-- Create storage policy for authenticated upload access
CREATE POLICY "Authenticated upload access for question images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'question-images' AND auth.role() = 'authenticated');

-- Create storage policy for authenticated update access
CREATE POLICY "Authenticated update access for question images" ON storage.objects
FOR UPDATE USING (bucket_id = 'question-images' AND auth.role() = 'authenticated');

-- Create storage policy for authenticated delete access
CREATE POLICY "Authenticated delete access for question images" ON storage.objects
FOR DELETE USING (bucket_id = 'question-images' AND auth.role() = 'authenticated'); 