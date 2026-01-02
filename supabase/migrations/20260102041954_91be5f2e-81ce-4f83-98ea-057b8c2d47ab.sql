-- Fix the view to use security invoker (caller's permissions)
DROP VIEW IF EXISTS public.instagram_leads_with_emails;

CREATE VIEW public.instagram_leads_with_emails 
WITH (security_invoker = true)
AS
SELECT 
  c.id as conversation_id,
  m.sender_name as ig_sender_name,
  m.content as message_content,
  m.created_at as message_date,
  CASE 
    WHEN m.content ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
    THEN (regexp_match(m.content, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', 'i'))[1]
    ELSE NULL
  END as extracted_email,
  m.direction
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'instagram'
AND m.direction = 'inbound'
ORDER BY m.created_at DESC;