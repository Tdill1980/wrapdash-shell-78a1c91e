-- Drop the existing check constraint
ALTER TABLE content_files DROP CONSTRAINT content_files_category_check;

-- Add updated constraint with ai_output category
ALTER TABLE content_files ADD CONSTRAINT content_files_category_check 
CHECK (
  content_category IS NULL 
  OR content_category = ANY (ARRAY[
    'raw'::text, 
    'template'::text, 
    'finished'::text, 
    'inspiration'::text, 
    'inspo_reference'::text, 
    'static_ad'::text, 
    'carousel'::text, 
    'audio'::text,
    'ai_output'::text
  ])
);