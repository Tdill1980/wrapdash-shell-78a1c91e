-- Add content_type column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Update existing WPW tasks based on their descriptions
UPDATE public.tasks SET content_type = 'email' WHERE channel = 'wpw' AND (LOWER(description) LIKE '%email%' OR LOWER(title) LIKE '%email%');
UPDATE public.tasks SET content_type = 'ig_reel' WHERE channel = 'wpw' AND content_type IS NULL AND (LOWER(description) LIKE '%reel%instagram%' OR LOWER(description) LIKE '%instagram%reel%' OR LOWER(title) LIKE '%ig reel%' OR LOWER(title) LIKE '%instagram reel%');
UPDATE public.tasks SET content_type = 'ig_story' WHERE channel = 'wpw' AND content_type IS NULL AND (LOWER(description) LIKE '%story%instagram%' OR LOWER(description) LIKE '%instagram%story%' OR LOWER(title) LIKE '%ig story%');
UPDATE public.tasks SET content_type = 'fb_reel' WHERE channel = 'wpw' AND content_type IS NULL AND (LOWER(description) LIKE '%reel%facebook%' OR LOWER(description) LIKE '%facebook%reel%' OR LOWER(title) LIKE '%fb reel%');
UPDATE public.tasks SET content_type = 'fb_story' WHERE channel = 'wpw' AND content_type IS NULL AND (LOWER(description) LIKE '%story%facebook%' OR LOWER(description) LIKE '%facebook%story%' OR LOWER(title) LIKE '%fb story%');
UPDATE public.tasks SET content_type = 'meta_ad' WHERE channel = 'wpw' AND content_type IS NULL AND (LOWER(description) LIKE '%meta%ad%' OR LOWER(description) LIKE '%ad%meta%' OR LOWER(title) LIKE '%meta ad%');
UPDATE public.tasks SET content_type = 'youtube_short' WHERE channel = 'wpw' AND content_type IS NULL AND (LOWER(description) LIKE '%short%youtube%' OR LOWER(description) LIKE '%youtube%short%' OR LOWER(title) LIKE '%youtube short%');
UPDATE public.tasks SET content_type = 'youtube_video' WHERE channel = 'wpw' AND content_type IS NULL AND (LOWER(description) LIKE '%youtube%' OR LOWER(title) LIKE '%youtube%');