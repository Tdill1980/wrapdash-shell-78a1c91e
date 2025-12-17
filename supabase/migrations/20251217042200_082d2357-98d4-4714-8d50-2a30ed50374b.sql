-- Update instagram_tokens table to support full Facebook OAuth flow
ALTER TABLE public.instagram_tokens 
ADD COLUMN IF NOT EXISTS user_access_token TEXT,
ADD COLUMN IF NOT EXISTS page_access_token TEXT,
ADD COLUMN IF NOT EXISTS page_id TEXT,
ADD COLUMN IF NOT EXISTS page_name TEXT,
ADD COLUMN IF NOT EXISTS instagram_user_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_username TEXT;

-- Add comment explaining the token types
COMMENT ON COLUMN public.instagram_tokens.user_access_token IS '60-day Facebook User Access Token (used for refreshing)';
COMMENT ON COLUMN public.instagram_tokens.page_access_token IS 'Page Access Token derived from user token (used for messaging API)';
COMMENT ON COLUMN public.instagram_tokens.access_token IS 'Legacy field - kept for backward compatibility, now stores page_access_token';
COMMENT ON COLUMN public.instagram_tokens.page_id IS 'Facebook Page ID';
COMMENT ON COLUMN public.instagram_tokens.page_name IS 'Facebook Page name for display';
COMMENT ON COLUMN public.instagram_tokens.instagram_user_id IS 'Instagram Business Account ID';
COMMENT ON COLUMN public.instagram_tokens.instagram_username IS 'Instagram @username for display';