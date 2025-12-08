-- Add design preview URLs to workspace_ai_memory
ALTER TABLE public.workspace_ai_memory 
ADD COLUMN IF NOT EXISTS last_design_preview_urls jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.workspace_ai_memory.last_design_preview_urls IS 'Array of URLs for the last generated design previews';