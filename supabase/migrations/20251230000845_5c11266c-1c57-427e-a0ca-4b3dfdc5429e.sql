-- =========================================
-- 1) EXECUTION RECEIPTS (new table)
-- Proof that something actually sent/published/paid.
-- =========================================
CREATE TABLE IF NOT EXISTS public.execution_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  conversation_id uuid REFERENCES public.conversations(id),
  source_table text NOT NULL DEFAULT 'ai_actions',
  source_id uuid NULL,
  channel text NOT NULL,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider text NULL,
  provider_receipt_id text NULL,
  payload_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS execution_receipts_conversation_idx
  ON public.execution_receipts(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS execution_receipts_source_idx
  ON public.execution_receipts(source_table, source_id);

CREATE INDEX IF NOT EXISTS execution_receipts_org_idx
  ON public.execution_receipts(organization_id, created_at DESC);

-- updated_at trigger
CREATE TRIGGER update_execution_receipts_updated_at
  BEFORE UPDATE ON public.execution_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 2) EXTEND ai_actions for approval workflow
-- =========================================
ALTER TABLE public.ai_actions
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS preview text,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS executed_at timestamptz;

CREATE INDEX IF NOT EXISTS ai_actions_conversation_idx
  ON public.ai_actions(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_actions_status_idx
  ON public.ai_actions(status, created_at DESC);

-- =========================================
-- 3) EXTEND conversations for thread controls
-- =========================================
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS ai_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS autopilot_allowed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS conversations_channel_last_idx
  ON public.conversations(channel, last_message_at DESC NULLS LAST);

-- =========================================
-- 4) EXTEND messages for sender tracking
-- =========================================
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_type text,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS messages_conversation_sent_idx
  ON public.messages(conversation_id, sent_at ASC);

-- =========================================
-- 5) RLS for execution_receipts
-- =========================================
ALTER TABLE public.execution_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execution_receipts_select"
  ON public.execution_receipts FOR SELECT
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "execution_receipts_insert"
  ON public.execution_receipts FOR INSERT
  WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "execution_receipts_update"
  ON public.execution_receipts FOR UPDATE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "execution_receipts_delete"
  ON public.execution_receipts FOR DELETE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));