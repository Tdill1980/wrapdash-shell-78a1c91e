-- Add output_payload column for structured multi-platform creative exports
-- This stores Meta Ads, TikTok/Reels variants, CSV-ready rows, and future platform exports
ALTER TABLE public.ai_creatives
ADD COLUMN output_payload JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.ai_creatives.output_payload IS 'Structured multi-platform export payload containing meta ads, reels, csv rows, and platform-specific variants';