-- Create shopflow-files storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('shopflow-files', 'shopflow-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view shopflow files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload shopflow files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload shopflow files" ON storage.objects;

-- RLS Policy: Allow public read access
CREATE POLICY "Anyone can view shopflow files"
ON storage.objects FOR SELECT
USING (bucket_id = 'shopflow-files');

-- RLS Policy: Allow anyone (including customers) to upload files
CREATE POLICY "Anyone can upload shopflow files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shopflow-files');