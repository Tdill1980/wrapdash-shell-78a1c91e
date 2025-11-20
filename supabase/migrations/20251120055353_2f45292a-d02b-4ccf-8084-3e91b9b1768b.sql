-- Create table for dashboard hero images
CREATE TABLE public.dashboard_hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'night', 'all')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_hero_images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active images
CREATE POLICY "Anyone can view active hero images"
  ON public.dashboard_hero_images
  FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can insert
CREATE POLICY "Admins can insert hero images"
  ON public.dashboard_hero_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update
CREATE POLICY "Admins can update hero images"
  ON public.dashboard_hero_images
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete
CREATE POLICY "Admins can delete hero images"
  ON public.dashboard_hero_images
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for hero images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('dashboard-hero', 'dashboard-hero', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hero images
CREATE POLICY "Anyone can view hero images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'dashboard-hero');

CREATE POLICY "Admins can upload hero images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dashboard-hero' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete hero images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dashboard-hero' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_dashboard_hero_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_dashboard_hero_images_updated_at
  BEFORE UPDATE ON public.dashboard_hero_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dashboard_hero_images_updated_at();