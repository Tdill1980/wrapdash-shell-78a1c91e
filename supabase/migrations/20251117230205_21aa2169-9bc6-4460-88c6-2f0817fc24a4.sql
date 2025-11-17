-- Fix design-vault storage bucket RLS policies to allow uploads

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view design vault files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload design vault files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update design vault files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete design vault files" ON storage.objects;

-- Allow anyone to view files in design-vault bucket (it's public)
CREATE POLICY "Anyone can view design vault files"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-vault');

-- Allow anyone to upload files to design-vault bucket
CREATE POLICY "Anyone can upload design vault files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-vault');

-- Allow anyone to update files in design-vault bucket
CREATE POLICY "Anyone can update design vault files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'design-vault');

-- Allow anyone to delete files in design-vault bucket
CREATE POLICY "Anyone can delete design vault files"
ON storage.objects FOR DELETE
USING (bucket_id = 'design-vault');