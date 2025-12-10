-- Content Queue Table for Hybrid Creative Engine
CREATE TABLE public.content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Content identification
  title TEXT,
  content_type TEXT CHECK (content_type IN ('reel', 'static', 'carousel', 'story', 'ad')),
  mode TEXT CHECK (mode IN ('auto', 'hybrid', 'exact')) DEFAULT 'auto',
  
  -- Content data
  media_urls TEXT[] DEFAULT '{}',
  output_url TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  cta_text TEXT,
  script TEXT,
  
  -- AI metadata
  ai_prompt TEXT,
  ai_metadata JSONB DEFAULT '{}',
  references_urls TEXT[] DEFAULT '{}',
  
  -- Scheduling
  platform TEXT DEFAULT 'instagram',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Workflow status
  status TEXT CHECK (status IN ('draft', 'needs_review', 'approved', 'scheduled', 'deployed', 'failed')) DEFAULT 'draft',
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view content queue in their organization"
ON public.content_queue FOR SELECT
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert content queue in their organization"
ON public.content_queue FOR INSERT
WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update content queue in their organization"
ON public.content_queue FOR UPDATE
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete content queue in their organization"
ON public.content_queue FOR DELETE
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Indexes
CREATE INDEX idx_content_queue_org_status ON public.content_queue(organization_id, status);
CREATE INDEX idx_content_queue_scheduled ON public.content_queue(scheduled_for) WHERE scheduled_for IS NOT NULL;