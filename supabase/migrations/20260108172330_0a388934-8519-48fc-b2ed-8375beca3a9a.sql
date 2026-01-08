-- Add notification_email column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS notification_email TEXT DEFAULT NULL;

-- Set default for WPW main organization
UPDATE public.organizations 
SET notification_email = 'design@weprintwraps.com' 
WHERE subdomain = 'main';