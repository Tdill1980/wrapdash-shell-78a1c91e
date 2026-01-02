-- Update all website chats with agent 'luigi' or 'wpw_ai_team' to 'jordan_lee' for consistency
UPDATE conversations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{agent}',
  '"jordan_lee"'
)
WHERE channel = 'website'
AND (
  metadata->>'agent' = 'luigi' 
  OR metadata->>'agent' = 'wpw_ai_team'
  OR metadata->>'agent' IS NULL
);