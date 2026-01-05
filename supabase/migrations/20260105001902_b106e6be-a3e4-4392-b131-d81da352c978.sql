-- Backfill empty tags for existing content_files
-- This ensures all files have meaningful tags for filtering

-- Tag files with "ReelBuilder Export" source
UPDATE content_files
SET tags = ARRAY['reel', 'reelbuilder', 'legacy', 'manual-export']
WHERE (tags IS NULL OR tags = '{}')
  AND (source = 'reelbuilder_export' OR original_filename ILIKE '%ReelBuilder%Export%');

-- Tag files with "Test Render Upload" source  
UPDATE content_files
SET tags = ARRAY['rendered', 'mightyedit', 'legacy', 'test-upload']
WHERE (tags IS NULL OR tags = '{}')
  AND (source = 'test_render' OR original_filename ILIKE '%Test%Render%');

-- Tag files from ai_reel_builder source that are missing tags
UPDATE content_files
SET tags = ARRAY['ai-created', 'reel', 'legacy']
WHERE (tags IS NULL OR tags = '{}')
  AND source = 'ai_reel_builder';

-- Tag generic uploads from inspo that are missing tags
UPDATE content_files
SET tags = ARRAY['inspo', 'reference', 'legacy']
WHERE (tags IS NULL OR tags = '{}')
  AND content_category = 'inspo_reference';

-- Tag generic video uploads that are missing tags
UPDATE content_files
SET tags = ARRAY['video', 'upload', 'legacy', 'untagged']
WHERE (tags IS NULL OR tags = '{}')
  AND file_type = 'video';

-- Tag generic image uploads that are missing tags  
UPDATE content_files
SET tags = ARRAY['image', 'upload', 'legacy', 'untagged']
WHERE (tags IS NULL OR tags = '{}')
  AND file_type = 'image';

-- Catch-all for any remaining null tags
UPDATE content_files
SET tags = ARRAY['legacy', 'untagged']
WHERE tags IS NULL;