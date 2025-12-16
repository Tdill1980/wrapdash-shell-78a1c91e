-- Add orchestrator role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'orchestrator';

-- Create team_commands table for orchestrator -> AI agent communications
CREATE TABLE IF NOT EXISTS public.team_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_agent TEXT NOT NULL, -- 'luigi', 'hello_email', 'design_email', 'jackson_email', 'instagram'
  command_type TEXT NOT NULL, -- 'respond', 'adjust_quote', 'hold', 'approve', 'reject', 'edit'
  command_text TEXT, -- The actual instruction text
  command_payload JSONB, -- Additional data (quote adjustments, etc.)
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'executed', 'cancelled'
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add review_status column to conversations for quote review workflow
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT NULL;

-- Add recipient_inbox to track which email inbox received the message
-- This will be stored in metadata, but let's also add a dedicated column for easier filtering
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS recipient_inbox TEXT DEFAULT NULL;

-- Enable RLS on team_commands
ALTER TABLE public.team_commands ENABLE ROW LEVEL SECURITY;

-- Orchestrators and admins can manage team commands
CREATE POLICY "Orchestrators can manage team commands"
ON public.team_commands
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'orchestrator')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'orchestrator')
);

-- Create index for faster conversation filtering by inbox
CREATE INDEX IF NOT EXISTS idx_conversations_recipient_inbox ON public.conversations(recipient_inbox);
CREATE INDEX IF NOT EXISTS idx_conversations_review_status ON public.conversations(review_status);
CREATE INDEX IF NOT EXISTS idx_team_commands_conversation ON public.team_commands(conversation_id);
CREATE INDEX IF NOT EXISTS idx_team_commands_status ON public.team_commands(status);