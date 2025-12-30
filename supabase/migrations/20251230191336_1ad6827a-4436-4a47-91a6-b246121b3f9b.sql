-- Add execution lifecycle timestamps to content_calendar
ALTER TABLE content_calendar
  ADD COLUMN IF NOT EXISTS in_progress_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz;

-- Note: published_at already exists in the table