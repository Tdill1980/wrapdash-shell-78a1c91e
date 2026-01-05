-- Fix SECURITY DEFINER views by setting security_invoker = true
-- This ensures views use the querying user's permissions, not the view creator's

-- Drop and recreate migrated_content_audit with security_invoker
DROP VIEW IF EXISTS public.migrated_content_audit;
CREATE VIEW public.migrated_content_audit 
WITH (security_invoker = true)
AS
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

-- Drop and recreate website_chat_conversations with security_invoker
DROP VIEW IF EXISTS public.website_chat_conversations;
CREATE VIEW public.website_chat_conversations 
WITH (security_invoker = true)
AS
SELECT 
    id,
    contact_id,
    organization_id,
    channel,
    subject,
    status,
    priority,
    assigned_to,
    last_message_at,
    unread_count,
    metadata,
    created_at,
    chat_state,
    review_status,
    recipient_inbox,
    ai_paused,
    approval_required,
    autopilot_allowed
FROM conversations
WHERE channel = 'website';

-- Drop and recreate mightychat_conversations with security_invoker
DROP VIEW IF EXISTS public.mightychat_conversations;
CREATE VIEW public.mightychat_conversations 
WITH (security_invoker = true)
AS
SELECT 
    id,
    contact_id,
    organization_id,
    channel,
    subject,
    status,
    priority,
    assigned_to,
    last_message_at,
    unread_count,
    metadata,
    created_at,
    chat_state,
    review_status,
    recipient_inbox,
    ai_paused,
    approval_required,
    autopilot_allowed
FROM conversations
WHERE channel = ANY (ARRAY['instagram', 'facebook']);