-- Add unique constraint on content_file_id for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_edit_queue_content_file_id 
ON public.video_edit_queue(content_file_id) 
WHERE content_file_id IS NOT NULL;