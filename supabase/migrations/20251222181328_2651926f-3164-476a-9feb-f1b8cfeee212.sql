-- Add offers_installation column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN offers_installation boolean DEFAULT true;

-- Set WePrintWraps.com (main subdomain) to print-only
UPDATE public.organizations 
SET offers_installation = false 
WHERE subdomain = 'main';