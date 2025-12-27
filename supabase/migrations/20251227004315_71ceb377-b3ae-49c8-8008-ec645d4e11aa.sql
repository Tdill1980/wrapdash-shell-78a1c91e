-- Add missing UTM and category columns to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}';

-- Create quote_retargeting_log table for tracking follow-up emails
CREATE TABLE IF NOT EXISTS public.quote_retargeting_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  resend_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_retargeting_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage all retargeting logs (edge functions use service role)
CREATE POLICY "Service role can manage retargeting logs"
  ON public.quote_retargeting_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view logs for admin dashboard
CREATE POLICY "Authenticated users can view retargeting logs"
  ON public.quote_retargeting_log FOR SELECT
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quote_retargeting_log_quote_id ON public.quote_retargeting_log(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_retargeting_log_email_type ON public.quote_retargeting_log(email_type);