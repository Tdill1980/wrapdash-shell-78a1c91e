-- Create affiliate_media table for creator content uploads
CREATE TABLE public.affiliate_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  organization_id UUID,
  brand TEXT NOT NULL DEFAULT 'wpw',
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'raw' CHECK (type IN ('raw', 'finished', 'photo')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  notes TEXT,
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_media ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own uploads
CREATE POLICY "Affiliates can view their own media"
ON public.affiliate_media FOR SELECT
USING (affiliate_id::text = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role));

-- Affiliates can insert their own media
CREATE POLICY "Affiliates can insert their own media"
ON public.affiliate_media FOR INSERT
WITH CHECK (affiliate_id::text = auth.uid()::text);

-- Affiliates can update their own pending media
CREATE POLICY "Affiliates can update their own pending media"
ON public.affiliate_media FOR UPDATE
USING (affiliate_id::text = auth.uid()::text AND status = 'pending');

-- Admins can update any media (for review)
CREATE POLICY "Admins can update any media"
ON public.affiliate_media FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete media
CREATE POLICY "Admins can delete media"
ON public.affiliate_media FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_affiliate_media_updated_at
BEFORE UPDATE ON public.affiliate_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for affiliate media if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('affiliate-media', 'affiliate-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for affiliate media
CREATE POLICY "Affiliates can upload their own media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'affiliate-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view affiliate media"
ON storage.objects FOR SELECT
USING (bucket_id = 'affiliate-media');

CREATE POLICY "Affiliates can update their own media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'affiliate-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete affiliate media"
ON storage.objects FOR DELETE
USING (bucket_id = 'affiliate-media' AND has_role(auth.uid(), 'admin'::app_role));