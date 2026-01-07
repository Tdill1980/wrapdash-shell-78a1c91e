-- =============================================
-- ColorPro Film Catalog OS
-- Authoritative source of truth for vinyl films
-- =============================================

-- 1) Authoritative film catalog (OS source of truth)
CREATE TABLE IF NOT EXISTS public.film_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  manufacturer TEXT NOT NULL CHECK (manufacturer IN ('3m', 'avery')),
  series TEXT NOT NULL,                         -- '2080' | 'sw900'
  official_code TEXT NOT NULL,                  -- 'G77' | 'GP281' | 'SW900-190-O'
  official_name TEXT NOT NULL,                  -- 'Sky Blue' | 'Gloss Flip Psychedelic'
  finish TEXT,                                  -- gloss/matte/satin/metallic/chrome/texture
  chart_version TEXT,                           -- e.g. '3M-2018-10' or 'Avery-SWF'
  source_file TEXT,                             -- filename or storage path
  
  swatch_image_url TEXT,                        -- optional
  swatch_hex TEXT,                              -- optional UI hint only
  swatch_lab JSONB,                             -- optional for future color matching
  
  needs_review BOOLEAN NOT NULL DEFAULT false,  -- importer flags low-confidence rows
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (manufacturer, series, official_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS film_catalog_mfr_idx ON public.film_catalog (manufacturer);
CREATE INDEX IF NOT EXISTS film_catalog_series_idx ON public.film_catalog (series);
CREATE INDEX IF NOT EXISTS film_catalog_active_idx ON public.film_catalog (is_active);

-- 2) Public view for UI (only active films)
CREATE OR REPLACE VIEW public.film_catalog_public AS
SELECT
  id,
  manufacturer,
  series,
  official_code,
  official_name,
  finish,
  swatch_image_url,
  swatch_hex,
  needs_review
FROM public.film_catalog
WHERE is_active = true;

-- 3) Updated-at trigger (reuse existing function if available)
CREATE OR REPLACE FUNCTION public.set_film_catalog_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_film_catalog_updated ON public.film_catalog;
CREATE TRIGGER trg_film_catalog_updated
BEFORE UPDATE ON public.film_catalog
FOR EACH ROW EXECUTE FUNCTION public.set_film_catalog_updated_at();

-- 4) Enable RLS
ALTER TABLE public.film_catalog ENABLE ROW LEVEL SECURITY;

-- 5) Policies - catalog is readable by all authenticated users
CREATE POLICY "Film catalog is readable by authenticated users"
ON public.film_catalog FOR SELECT
TO authenticated
USING (true);

-- Admin insert/update (service role only for catalog management)
CREATE POLICY "Service role can manage film catalog"
ON public.film_catalog FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6) Seed initial data for common 3M 2080 and Avery SW900 films
INSERT INTO public.film_catalog (manufacturer, series, official_code, official_name, finish, chart_version, source_file, swatch_hex, needs_review)
VALUES
  -- 3M 2080 Series (common colors)
  ('3m', '2080', 'G12', 'Gloss Black', 'gloss', '3M-2080-v1', 'seed', '#000000', false),
  ('3m', '2080', 'G10', 'Gloss White', 'gloss', '3M-2080-v1', 'seed', '#FFFFFF', false),
  ('3m', '2080', 'G77', 'Sky Blue', 'gloss', '3M-2080-v1', 'seed', '#87CEEB', false),
  ('3m', '2080', 'G47', 'Gloss Intense Blue', 'gloss', '3M-2080-v1', 'seed', '#1E90FF', false),
  ('3m', '2080', 'G13', 'Gloss Hot Rod Red', 'gloss', '3M-2080-v1', 'seed', '#CC0000', false),
  ('3m', '2080', 'G14', 'Gloss Burnt Orange', 'gloss', '3M-2080-v1', 'seed', '#CC5500', false),
  ('3m', '2080', 'G15', 'Gloss Bright Yellow', 'gloss', '3M-2080-v1', 'seed', '#FFD700', false),
  ('3m', '2080', 'G17', 'Gloss Kelly Green', 'gloss', '3M-2080-v1', 'seed', '#4CBB17', false),
  ('3m', '2080', 'G120', 'Gloss White Aluminum', 'gloss', '3M-2080-v1', 'seed', '#F5F5F5', false),
  ('3m', '2080', 'G211', 'Gloss Charcoal Metallic', 'gloss', '3M-2080-v1', 'seed', '#36454F', false),
  ('3m', '2080', 'S12', 'Satin Black', 'satin', '3M-2080-v1', 'seed', '#1A1A1A', false),
  ('3m', '2080', 'S10', 'Satin White', 'satin', '3M-2080-v1', 'seed', '#F8F8F8', false),
  ('3m', '2080', 'M12', 'Matte Black', 'matte', '3M-2080-v1', 'seed', '#0D0D0D', false),
  ('3m', '2080', 'M10', 'Matte White', 'matte', '3M-2080-v1', 'seed', '#FAFAFA', false),
  ('3m', '2080', 'M21', 'Matte Silver', 'matte', '3M-2080-v1', 'seed', '#C0C0C0', false),
  ('3m', '2080', 'GP281', 'Gloss Flip Psychedelic', 'gloss', '3M-2080-v1', 'seed', '#8B00FF', false),
  ('3m', '2080', 'GP278', 'Gloss Flip Ghost Pearl', 'gloss', '3M-2080-v1', 'seed', '#E8E8E8', false),
  ('3m', '2080', 'SP273', 'Satin Flip Volcanic Flare', 'satin', '3M-2080-v1', 'seed', '#FF4500', false),
  ('3m', '2080', 'BR212', 'Brushed Black Metallic', 'brushed', '3M-2080-v1', 'seed', '#2F2F2F', false),
  ('3m', '2080', 'CFS12', 'Carbon Fiber Black', 'textured', '3M-2080-v1', 'seed', '#1C1C1C', false),
  
  -- Avery SW900 Series (common colors)
  ('avery', 'sw900', 'SW900-190-O', 'Obsidian Black', 'gloss', 'Avery-SW900-v1', 'seed', '#050505', false),
  ('avery', 'sw900', 'SW900-193-O', 'Gloss White', 'gloss', 'Avery-SW900-v1', 'seed', '#FFFFFF', false),
  ('avery', 'sw900', 'SW900-418-O', 'Gloss Cardinal Red', 'gloss', 'Avery-SW900-v1', 'seed', '#C41E3A', false),
  ('avery', 'sw900', 'SW900-426-O', 'Gloss Dark Red', 'gloss', 'Avery-SW900-v1', 'seed', '#8B0000', false),
  ('avery', 'sw900', 'SW900-474-O', 'Gloss Orange', 'gloss', 'Avery-SW900-v1', 'seed', '#FF6600', false),
  ('avery', 'sw900', 'SW900-225-O', 'Gloss Yellow', 'gloss', 'Avery-SW900-v1', 'seed', '#FFD700', false),
  ('avery', 'sw900', 'SW900-734-O', 'Gloss Grass Green', 'gloss', 'Avery-SW900-v1', 'seed', '#228B22', false),
  ('avery', 'sw900', 'SW900-646-O', 'Gloss Light Blue', 'gloss', 'Avery-SW900-v1', 'seed', '#ADD8E6', false),
  ('avery', 'sw900', 'SW900-677-O', 'Gloss Bright Blue', 'gloss', 'Avery-SW900-v1', 'seed', '#0066CC', false),
  ('avery', 'sw900', 'SW900-566-O', 'Gloss Purple', 'gloss', 'Avery-SW900-v1', 'seed', '#800080', false),
  ('avery', 'sw900', 'SW900-180-X', 'Satin Black', 'satin', 'Avery-SW900-v1', 'seed', '#1A1A1A', false),
  ('avery', 'sw900', 'SW900-170-O', 'Matte Black', 'matte', 'Avery-SW900-v1', 'seed', '#0D0D0D', false),
  ('avery', 'sw900', 'SW900-803-O', 'Gloss Rock Gray', 'gloss', 'Avery-SW900-v1', 'seed', '#6E6E6E', false),
  ('avery', 'sw900', 'SW900-197-O', 'Gloss Silver Metallic', 'gloss', 'Avery-SW900-v1', 'seed', '#B8B8B8', false),
  ('avery', 'sw900', 'SW900-196-S', 'Matte Metallic Silver', 'matte', 'Avery-SW900-v1', 'seed', '#A8A8A8', false)
ON CONFLICT (manufacturer, series, official_code) DO NOTHING;