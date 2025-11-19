-- Create quotes table for MightyMail
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  
  -- Customer information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  
  -- Vehicle information
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_details TEXT,
  
  -- Product and pricing
  product_name TEXT,
  sqft NUMERIC,
  material_cost NUMERIC,
  labor_cost NUMERIC,
  total_price NUMERIC NOT NULL,
  margin NUMERIC DEFAULT 65,
  
  -- Quote status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  wc_sync_status TEXT DEFAULT 'not_synced',
  follow_up_count INTEGER DEFAULT 0,
  last_follow_up_sent TIMESTAMPTZ,
  
  -- Email settings
  auto_retarget BOOLEAN DEFAULT true,
  email_tone TEXT DEFAULT 'installer',
  email_design TEXT DEFAULT 'performance',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view quotes"
  ON public.quotes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quotes"
  ON public.quotes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quotes"
  ON public.quotes FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX idx_quotes_customer_email ON public.quotes(customer_email);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at_trigger
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();