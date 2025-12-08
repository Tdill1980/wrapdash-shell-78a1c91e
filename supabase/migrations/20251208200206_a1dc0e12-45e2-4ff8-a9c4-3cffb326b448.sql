-- Create seed-data storage bucket for CSV imports
INSERT INTO storage.buckets (id, name, public)
VALUES ('seed-data', 'seed-data', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to seed-data bucket
CREATE POLICY "Admins can upload seed data"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'seed-data' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow the service role to read seed data (for edge function)
CREATE POLICY "Service role can read seed data"
ON storage.objects
FOR SELECT
USING (bucket_id = 'seed-data');