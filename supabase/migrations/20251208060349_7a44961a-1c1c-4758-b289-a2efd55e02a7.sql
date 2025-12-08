-- Table: chatbot_scripts - Stores chatbot flows and AI prompts per organization
CREATE TABLE IF NOT EXISTS public.chatbot_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  script_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  type text NOT NULL DEFAULT 'chatbot',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: lead_generators - Stores embeddable forms, QR codes, etc.
CREATE TABLE IF NOT EXISTS public.lead_generators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  embed_code text,
  redirect_url text,
  qr_code_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: lead_sources - Tracks where leads came from
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  source text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table: message_ingest_log - Unified incoming message log
CREATE TABLE IF NOT EXISTS public.message_ingest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform text NOT NULL,
  sender_id text,
  sender_username text,
  message_text text,
  raw_payload jsonb,
  processed boolean DEFAULT false,
  intent text,
  created_at timestamptz DEFAULT now()
);

-- Table: ai_actions - AI suggestions for MCP
CREATE TABLE IF NOT EXISTS public.ai_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_payload jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'normal',
  resolved boolean DEFAULT false,
  resolved_by uuid,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS on all new tables
ALTER TABLE public.chatbot_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_ingest_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_scripts
CREATE POLICY "Users can view chatbot scripts in their organization" ON public.chatbot_scripts
  FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert chatbot scripts in their organization" ON public.chatbot_scripts
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update chatbot scripts in their organization" ON public.chatbot_scripts
  FOR UPDATE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete chatbot scripts in their organization" ON public.chatbot_scripts
  FOR DELETE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for lead_generators
CREATE POLICY "Users can view lead generators in their organization" ON public.lead_generators
  FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert lead generators in their organization" ON public.lead_generators
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update lead generators in their organization" ON public.lead_generators
  FOR UPDATE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete lead generators in their organization" ON public.lead_generators
  FOR DELETE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for lead_sources
CREATE POLICY "Users can view lead sources in their organization" ON public.lead_sources
  FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert lead sources" ON public.lead_sources
  FOR INSERT WITH CHECK (true);

-- RLS Policies for message_ingest_log
CREATE POLICY "Users can view message logs in their organization" ON public.message_ingest_log
  FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Anyone can insert message logs" ON public.message_ingest_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update message logs in their organization" ON public.message_ingest_log
  FOR UPDATE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for ai_actions
CREATE POLICY "Users can view AI actions in their organization" ON public.ai_actions
  FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Anyone can insert AI actions" ON public.ai_actions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update AI actions in their organization" ON public.ai_actions
  FOR UPDATE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_scripts_org ON public.chatbot_scripts(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_generators_org ON public.lead_generators(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_org ON public.lead_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_contact ON public.lead_sources(contact_id);
CREATE INDEX IF NOT EXISTS idx_message_ingest_org ON public.message_ingest_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_message_ingest_platform ON public.message_ingest_log(platform);
CREATE INDEX IF NOT EXISTS idx_ai_actions_org ON public.ai_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_resolved ON public.ai_actions(resolved);

-- Enable realtime for ai_actions and message_ingest_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_ingest_log;