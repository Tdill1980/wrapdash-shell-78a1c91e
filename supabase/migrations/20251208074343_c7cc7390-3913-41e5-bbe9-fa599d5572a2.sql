-- Add AI quote tracking columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_sqft_estimate numeric,
ADD COLUMN IF NOT EXISTS ai_vehicle_class text,
ADD COLUMN IF NOT EXISTS ai_labor_hours numeric,
ADD COLUMN IF NOT EXISTS ai_low_price numeric,
ADD COLUMN IF NOT EXISTS ai_high_price numeric,
ADD COLUMN IF NOT EXISTS ai_message text,
ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz;