-- PASS 1: Add migrated tracking column
ALTER TABLE content_calendar
  ADD COLUMN IF NOT EXISTS migrated boolean DEFAULT false;

-- PASS 2: Link tasks to calendar by heuristic matching
-- Match by title similarity OR (brand + time proximity)
UPDATE tasks t
SET content_calendar_id = c.id
FROM content_calendar c
WHERE t.content_calendar_id IS NULL
  AND (
    -- Title match (task title contains calendar title or vice versa)
    LOWER(t.title) LIKE '%' || LOWER(COALESCE(c.title, '')) || '%'
    OR LOWER(COALESCE(c.title, '')) LIKE '%' || LOWER(t.title) || '%'
    -- Or brand/channel match with time proximity
    OR (
      (t.channel = c.brand OR t.channel IS NULL)
      AND t.created_at BETWEEN c.created_at - INTERVAL '48 hours'
                           AND c.created_at + INTERVAL '48 hours'
    )
  )
  AND c.title IS NOT NULL
  AND LENGTH(c.title) > 3;

-- PASS 3A: Tasks IN PROGRESS → Calendar IN PROGRESS
UPDATE content_calendar c
SET status = 'in_progress',
    in_progress_at = COALESCE(c.in_progress_at, now())
FROM tasks t
WHERE t.content_calendar_id = c.id
  AND t.status = 'in_progress'
  AND c.status = 'draft';

-- PASS 3B: Completed Tasks → Calendar READY
UPDATE content_calendar c
SET status = 'ready',
    ready_at = COALESCE(c.ready_at, now())
FROM tasks t
WHERE t.content_calendar_id = c.id
  AND t.status = 'completed'
  AND c.status IN ('draft', 'in_progress');

-- PASS 4: Mark migrated calendar items
UPDATE content_calendar
SET migrated = true
WHERE id IN (
  SELECT DISTINCT content_calendar_id
  FROM tasks
  WHERE content_calendar_id IS NOT NULL
);

-- Create audit view for inspection
CREATE OR REPLACE VIEW migrated_content_audit AS
SELECT
  c.id,
  c.title,
  c.brand,
  c.status,
  c.in_progress_at,
  c.ready_at,
  c.posted_at,
  c.migrated,
  t.id AS task_id,
  t.title AS task_title,
  t.status AS task_status,
  t.assigned_agent
FROM content_calendar c
LEFT JOIN tasks t ON t.content_calendar_id = c.id
WHERE c.migrated = true;