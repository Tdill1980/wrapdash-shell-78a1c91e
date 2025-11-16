-- Create color_visualizations table for storing 3D wrap renders
CREATE TABLE IF NOT EXISTS public.color_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  customer_email TEXT,
  vehicle_year INTEGER,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  infusion_color_id TEXT,
  color_hex TEXT,
  color_name TEXT,
  finish_type TEXT NOT NULL,
  has_metallic_flakes BOOLEAN DEFAULT false,
  custom_swatch_url TEXT,
  custom_design_url TEXT,
  design_file_name TEXT,
  uses_custom_design BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'pro',
  render_urls JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.color_visualizations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for now)
CREATE POLICY "Anyone can view visualizations"
ON public.color_visualizations
FOR SELECT
USING (true);

-- Create policy for authenticated insert
CREATE POLICY "Authenticated users can insert visualizations"
ON public.color_visualizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_color_visualizations_org_id 
ON public.color_visualizations(organization_id);

-- Create index on tags for search functionality
CREATE INDEX IF NOT EXISTS idx_color_visualizations_tags 
ON public.color_visualizations USING GIN(tags);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_color_visualizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_color_visualizations_updated_at
BEFORE UPDATE ON public.color_visualizations
FOR EACH ROW
EXECUTE FUNCTION public.update_color_visualizations_updated_at();