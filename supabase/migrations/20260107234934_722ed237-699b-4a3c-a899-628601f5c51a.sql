-- Create conversation_events table for immutable audit logging
CREATE TABLE public.conversation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- Types: escalation_sent, email_sent, quote_attached, asset_uploaded,
  --        file_reviewed, marked_complete, internal_note, ai_response
  subtype TEXT,
  -- Subtypes: jackson, lance, design, bulk, quality_issue, etc.
  actor TEXT NOT NULL DEFAULT 'system',
  -- Values: system, jordan_lee, human, admin
  payload JSONB DEFAULT '{}',
  -- Contains: email_body, recipients, file_url, reason, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_conversation_events_convo ON public.conversation_events(conversation_id);
CREATE INDEX idx_conversation_events_type ON public.conversation_events(event_type);
CREATE INDEX idx_conversation_events_created ON public.conversation_events(created_at DESC);
CREATE INDEX idx_conversation_events_subtype ON public.conversation_events(subtype);

-- Enable RLS
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow org members to read events for their conversations
CREATE POLICY "Organization members can view conversation events"
ON public.conversation_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = conversation_events.conversation_id
    AND om.user_id = auth.uid()
  )
);

-- Allow system/edge functions to insert events (via service role)
CREATE POLICY "Service role can insert conversation events"
ON public.conversation_events
FOR INSERT
WITH CHECK (true);

-- Allow admins to insert events
CREATE POLICY "Admins can insert conversation events"
ON public.conversation_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Enable realtime for conversation_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_events;

-- Backfill existing escalation data from agent_alerts
INSERT INTO public.conversation_events (conversation_id, event_type, subtype, actor, payload, created_at)
SELECT 
  conversation_id,
  'escalation_sent',
  alert_type,
  'jordan_lee',
  jsonb_build_object(
    'email_sent_to', email_sent_to,
    'email_sent_at', email_sent_at,
    'message_excerpt', message_excerpt,
    'customer_email', customer_email,
    'customer_name', customer_name,
    'order_number', order_number,
    'priority', priority,
    'metadata', metadata
  ),
  created_at
FROM public.agent_alerts
WHERE conversation_id IS NOT NULL;