-- Fix security definer issue by explicitly setting security invoker
DROP VIEW IF EXISTS ops_backlog_needs_response;

CREATE VIEW ops_backlog_needs_response 
WITH (security_invoker = true) AS
WITH last_inbound AS (
  SELECT conversation_id, max(created_at) AS last_inbound_at
  FROM messages
  WHERE direction = 'inbound'
  GROUP BY conversation_id
),
last_outbound AS (
  SELECT conversation_id, max(created_at) AS last_outbound_at
  FROM messages
  WHERE direction = 'outbound'
  GROUP BY conversation_id
)
SELECT
  c.id,
  c.channel,
  c.subject,
  li.last_inbound_at,
  lo.last_outbound_at,
  (li.last_inbound_at > COALESCE(lo.last_outbound_at, '1970-01-01'::timestamp)) AS needs_response
FROM conversations c
JOIN last_inbound li ON li.conversation_id = c.id
LEFT JOIN last_outbound lo ON lo.conversation_id = c.id
WHERE li.last_inbound_at > COALESCE(lo.last_outbound_at, '1970-01-01'::timestamp)
ORDER BY li.last_inbound_at DESC;