-- Add connection_method and forwarded_from tracking to organization_phone_settings
ALTER TABLE public.organization_phone_settings 
ADD COLUMN IF NOT EXISTS connection_method text DEFAULT 'new_number' CHECK (connection_method IN ('new_number', 'port_number', 'forward_calls')),
ADD COLUMN IF NOT EXISTS original_business_number text,
ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_completed_at timestamp with time zone;

-- Add forwarded_from field to phone_calls table to track forwarded call origins
ALTER TABLE public.phone_calls 
ADD COLUMN IF NOT EXISTS forwarded_from text,
ADD COLUMN IF NOT EXISTS original_called_number text,
ADD COLUMN IF NOT EXISTS forwarding_detected boolean DEFAULT false;

-- Add index for faster lookups on forwarded calls
CREATE INDEX IF NOT EXISTS idx_phone_calls_forwarded ON public.phone_calls(forwarded_from) WHERE forwarded_from IS NOT NULL;