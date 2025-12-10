-- Add content_category to content_files for categorizing media
ALTER TABLE content_files
ADD COLUMN IF NOT EXISTS content_category TEXT DEFAULT 'raw';

-- Add CHECK constraint for allowed values
ALTER TABLE content_files
ADD CONSTRAINT content_files_category_check 
CHECK (content_category IN ('raw', 'template', 'finished', 'inspiration'));

-- Add video/image dimension fields for preview rendering
ALTER TABLE content_files
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS thumbnail_generated_at TIMESTAMP WITH TIME ZONE;

-- Index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_content_files_category
ON content_files (content_category);

-- Comment for documentation
COMMENT ON COLUMN content_files.content_category IS 'Media category: raw (uploads), template (design refs), finished (approved), inspiration (mood boards)';