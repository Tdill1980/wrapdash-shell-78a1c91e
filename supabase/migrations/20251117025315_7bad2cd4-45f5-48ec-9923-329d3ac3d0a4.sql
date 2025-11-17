-- Create storage bucket for design vault images
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-vault', 'design-vault', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for design vault
CREATE POLICY "Anyone can view design vault images"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-vault');

CREATE POLICY "Authenticated users can upload design vault images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-vault' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete design vault images"
ON storage.objects FOR DELETE
USING (bucket_id = 'design-vault' AND auth.role() = 'authenticated');

-- Add UPDATE and DELETE policies for color_visualizations
CREATE POLICY "Authenticated users can update visualizations"
ON public.color_visualizations FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete visualizations"
ON public.color_visualizations FOR DELETE
USING (auth.role() = 'authenticated');