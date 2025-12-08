-- A) workspace_ai_memory table for AI conversation context
CREATE TABLE IF NOT EXISTS public.workspace_ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  last_intent TEXT,
  last_message_at TIMESTAMPTZ,
  last_vehicle JSONB,
  last_wrap_type TEXT,
  last_budget TEXT,
  last_design_style TEXT,
  last_order_lookup TEXT,
  ai_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, contact_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_ai_memory_org ON public.workspace_ai_memory(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_ai_memory_contact ON public.workspace_ai_memory(contact_id);

-- Enable RLS
ALTER TABLE public.workspace_ai_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view memory in their organization"
  ON public.workspace_ai_memory FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Anyone can insert memory"
  ON public.workspace_ai_memory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update memory in their organization"
  ON public.workspace_ai_memory FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- E) orchestrator_insights table for MCP AI recommendations
CREATE TABLE IF NOT EXISTS public.orchestrator_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  priority TEXT DEFAULT 'normal',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orchestrator_insights_org ON public.orchestrator_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_insights_resolved ON public.orchestrator_insights(resolved);

-- Enable RLS
ALTER TABLE public.orchestrator_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view insights in their organization"
  ON public.orchestrator_insights FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Anyone can insert insights"
  ON public.orchestrator_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update insights in their organization"
  ON public.orchestrator_insights FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);