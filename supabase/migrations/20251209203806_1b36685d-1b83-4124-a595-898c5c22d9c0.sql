-- Create media-library storage bucket with brand folders
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for media-library bucket
CREATE POLICY "Anyone can view media library files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media-library');

CREATE POLICY "Authenticated users can upload to media library" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media-library' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update media library files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'media-library' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete media library files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media-library' AND auth.role() = 'authenticated');