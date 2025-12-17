-- WPW Knowledge Base - Single source of truth for all AI agents
-- This is NOT customer-facing, it's internal AI reference material

CREATE TABLE public.wpw_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  applies_to_agents text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wpw_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS policies - org members can read, only specific roles can write
CREATE POLICY "Org members can view knowledge base"
  ON public.wpw_knowledge_base FOR SELECT
  USING (
    organization_id IS NULL 
    OR public.is_member_of_organization(auth.uid(), organization_id)
  );

CREATE POLICY "Admins can manage knowledge base"
  ON public.wpw_knowledge_base FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for fast lookups
CREATE INDEX idx_kb_category ON public.wpw_knowledge_base(category);
CREATE INDEX idx_kb_keywords ON public.wpw_knowledge_base USING GIN(keywords);
CREATE INDEX idx_kb_agents ON public.wpw_knowledge_base USING GIN(applies_to_agents);
CREATE INDEX idx_kb_active ON public.wpw_knowledge_base(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_wpw_knowledge_base_updated_at
  BEFORE UPDATE ON public.wpw_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();