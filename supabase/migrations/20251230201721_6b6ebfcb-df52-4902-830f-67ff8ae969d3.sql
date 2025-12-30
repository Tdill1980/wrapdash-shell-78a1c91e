-- Backfill conversation_id for ai_actions by matching sender_id in messages metadata
WITH sender_matches AS (
  SELECT DISTINCT ON (aa.id)
    aa.id as action_id,
    m.conversation_id
  FROM ai_actions aa
  JOIN messages m ON m.metadata->>'sender_id' = aa.action_payload->>'sender_id'
  WHERE aa.conversation_id IS NULL
    AND aa.action_payload->>'sender_id' IS NOT NULL
  ORDER BY aa.id, m.created_at DESC
)
UPDATE ai_actions aa
SET 
  conversation_id = sm.conversation_id,
  action_payload = jsonb_set(
    COALESCE(aa.action_payload, '{}'::jsonb),
    '{conversation_id}',
    to_jsonb(sm.conversation_id::text)
  )
FROM sender_matches sm
WHERE aa.id = sm.action_id;