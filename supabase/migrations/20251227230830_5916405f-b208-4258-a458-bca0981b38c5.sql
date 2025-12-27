-- Add columns for producer jobs and debug tracking
ALTER TABLE public.video_edit_queue
  ADD COLUMN IF NOT EXISTS debug_payload jsonb,
  ADD COLUMN IF NOT EXISTS producer_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS producer_blueprint jsonb;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS video_edit_queue_render_status_idx
  ON public.video_edit_queue(render_status);

CREATE INDEX IF NOT EXISTS video_edit_queue_created_at_idx
  ON public.video_edit_queue(created_at DESC);