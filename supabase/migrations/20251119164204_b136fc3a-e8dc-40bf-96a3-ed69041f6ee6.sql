-- Create email_events table for UTIM tracking
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'clicked', 'sent')),
  customer_id UUID REFERENCES public.email_retarget_customers(id),
  quote_id UUID REFERENCES public.quotes(id),
  utim_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add engagement tracking columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS utim_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_level TEXT DEFAULT 'cold',
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_events
CREATE POLICY "Authenticated users can view email events"
ON public.email_events FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert email events"
ON public.email_events FOR INSERT
WITH CHECK (true);

-- Create index for faster UTIM lookups
CREATE INDEX IF NOT EXISTS idx_email_events_quote_id ON public.email_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_email_events_customer_id ON public.email_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_engagement ON public.quotes(engagement_level, utim_score DESC);