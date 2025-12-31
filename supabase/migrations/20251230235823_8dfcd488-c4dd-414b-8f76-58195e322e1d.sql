-- Add email_sent column to track actual email delivery status
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_quotes_email_sent ON public.quotes(email_sent);