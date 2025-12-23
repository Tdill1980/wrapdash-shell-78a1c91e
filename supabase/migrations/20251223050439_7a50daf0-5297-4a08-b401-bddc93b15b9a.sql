-- Drop the old constraint and add a new one with more categories
ALTER TABLE public.content_files DROP CONSTRAINT IF EXISTS content_files_category_check;

ALTER TABLE public.content_files ADD CONSTRAINT content_files_category_check 
CHECK (content_category IS NULL OR content_category = ANY(ARRAY['raw', 'template', 'finished', 'inspiration', 'inspo_reference', 'static_ad', 'carousel', 'audio']));