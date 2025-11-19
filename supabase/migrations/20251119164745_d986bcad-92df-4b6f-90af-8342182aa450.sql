-- Add conversion tracking fields to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS converted_to_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS woo_order_id TEXT,
ADD COLUMN IF NOT EXISTS conversion_revenue NUMERIC DEFAULT 0;

-- Add conversion event type to email_events
ALTER TABLE public.email_events 
DROP CONSTRAINT IF EXISTS email_events_event_type_check;

ALTER TABLE public.email_events
ADD CONSTRAINT email_events_event_type_check 
CHECK (event_type IN ('opened', 'clicked', 'sent', 'converted'));

-- Create index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_quotes_converted ON public.quotes(converted_to_order, conversion_date DESC);