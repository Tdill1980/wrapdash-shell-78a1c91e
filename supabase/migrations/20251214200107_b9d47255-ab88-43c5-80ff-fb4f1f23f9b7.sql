-- Add VIN capture fields to portfolio_jobs
ALTER TABLE public.portfolio_jobs
ADD COLUMN IF NOT EXISTS vin_number TEXT,
ADD COLUMN IF NOT EXISTS vin_photo_path TEXT,
ADD COLUMN IF NOT EXISTS customer_acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS customer_signature_path TEXT,
ADD COLUMN IF NOT EXISTS liability_pdf_path TEXT;

-- Add liability documentation fields to portfolio_media
ALTER TABLE public.portfolio_media
ADD COLUMN IF NOT EXISTS condition_notes TEXT,
ADD COLUMN IF NOT EXISTS location_on_vehicle TEXT,
ADD COLUMN IF NOT EXISTS photo_timestamp TIMESTAMPTZ DEFAULT now();

-- Add public/featured flags for showcase
ALTER TABLE public.portfolio_jobs
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;