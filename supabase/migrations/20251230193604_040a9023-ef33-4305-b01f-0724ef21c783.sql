-- Fix security definer view warning by dropping and recreating without security definer
DROP VIEW IF EXISTS migrated_content_audit;

CREATE VIEW migrated_content_audit AS
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