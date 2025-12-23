-- Add brand/channel/purpose columns to content_queue for tagging system
ALTER TABLE public.content_queue 
ADD COLUMN IF NOT EXISTS brand text DEFAULT 'wpw',
ADD COLUMN IF NOT EXISTS channel text,
ADD COLUMN IF NOT EXISTS content_purpose text DEFAULT 'organic',
ADD COLUMN IF NOT EXISTS ad_placement text;

-- Add check constraint for content_purpose
ALTER TABLE public.content_queue 
ADD CONSTRAINT content_queue_purpose_check 
CHECK (content_purpose IN ('organic', 'paid'));

-- Add check constraint for ad_placement (only applies when paid)
ALTER TABLE public.content_queue 
ADD CONSTRAINT content_queue_placement_check 
CHECK (ad_placement IS NULL OR ad_placement IN ('feed', 'stories', 'reels', 'explore', 'search', 'audience_network'));

COMMENT ON COLUMN public.content_queue.brand IS 'Brand association: wpw, wraptv, wraptvworld, inkandedge, custom';
COMMENT ON COLUMN public.content_queue.channel IS 'Specific social channel/account handle';
COMMENT ON COLUMN public.content_queue.content_purpose IS 'Whether content is organic or paid advertising';
COMMENT ON COLUMN public.content_queue.ad_placement IS 'Ad placement for paid content: feed, stories, reels, explore, etc';