-- ============ AI CREATIVES - MASTER CREATIVE ASSET TABLE ============
-- This is the canonical record for every AI-created reel
-- Links blueprints, render jobs, and source provenance together

CREATE TABLE public.ai_creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Basic metadata
  title TEXT,
  description TEXT,
  
  -- Source provenance - WHERE did this come from?
  source_type TEXT NOT NULL CHECK (source_type IN ('mighty_task', 'content_calendar', 'noah_prompt', 'manual', 'producer_job')),
  source_id UUID, -- task_id, calendar_item_id, prompt_id (nullable for manual)
  
  -- Blueprint (the authoritative edit plan)
  blueprint JSONB NOT NULL DEFAULT '{}'::jsonb,
  blueprint_id TEXT, -- For reference (e.g., 'bp_auto_1234567890')
  
  -- Render tracking
  latest_render_job_id UUID REFERENCES public.video_edit_queue(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'rendering', 'complete', 'failed', 'archived')),
  
  -- Output
  thumbnail_url TEXT,
  output_url TEXT,
  
  -- Attribution
  created_by TEXT DEFAULT 'ai' CHECK (created_by IN ('ai', 'user', 'agent')),
  created_by_agent TEXT, -- 'noah', 'maya', etc.
  
  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_creatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ai_creatives in their organization"
ON public.ai_creatives
FOR SELECT
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert ai_creatives in their organization"
ON public.ai_creatives
FOR INSERT
WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update ai_creatives in their organization"
ON public.ai_creatives
FOR UPDATE
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete ai_creatives in their organization"
ON public.ai_creatives
FOR DELETE
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Indexes for common queries
CREATE INDEX idx_ai_creatives_source_type ON public.ai_creatives(source_type);
CREATE INDEX idx_ai_creatives_status ON public.ai_creatives(status);
CREATE INDEX idx_ai_creatives_created_at ON public.ai_creatives(created_at DESC);
CREATE INDEX idx_ai_creatives_organization_id ON public.ai_creatives(organization_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_creatives_updated_at
BEFORE UPDATE ON public.ai_creatives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add reference column to video_edit_queue to link back to creative
ALTER TABLE public.video_edit_queue
ADD COLUMN IF NOT EXISTS ai_creative_id UUID REFERENCES public.ai_creatives(id);