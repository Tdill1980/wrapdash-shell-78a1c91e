-- First update any NULL entries to prevent constraint failure
UPDATE video_edit_queue 
SET ai_edit_suggestions = '{"error": "legacy_null_entry"}'::jsonb 
WHERE ai_edit_suggestions IS NULL;

-- Convert to jsonb type
ALTER TABLE video_edit_queue
ALTER COLUMN ai_edit_suggestions
TYPE jsonb
USING ai_edit_suggestions::jsonb;

-- Now enforce NOT NULL
ALTER TABLE video_edit_queue
ALTER COLUMN ai_edit_suggestions
SET NOT NULL;