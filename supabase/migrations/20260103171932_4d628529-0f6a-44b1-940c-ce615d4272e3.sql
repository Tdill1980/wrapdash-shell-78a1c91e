-- Add finalization tracking columns to ai_creatives
ALTER TABLE ai_creatives 
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS download_url TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add finalization tracking columns to video_edit_queue
ALTER TABLE video_edit_queue
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS download_url TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT;