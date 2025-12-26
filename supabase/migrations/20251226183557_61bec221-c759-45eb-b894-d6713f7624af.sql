-- Content Drafts table for approval workflow before publishing
-- Used by Noah/Emily to queue content, reviewed by orchestrators, executed by Ops Desk

CREATE TABLE public.content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  task_id UUID REFERENCES public.tasks(id),
  created_by UUID,
  created_by_agent TEXT, -- 'noah_bennett', 'emily_carter'
  
  -- Content details
  content_type TEXT NOT NULL, -- 'reel', 'story', 'post', 'ad', 'email'
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'youtube', 'email'
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  scheduled_for TIMESTAMPTZ,
  
  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending_review', -- pending_review, approved, rejected, published, scheduled
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Publishing result
  published_at TIMESTAMPTZ,
  published_url TEXT,
  platform_post_id TEXT,
  publish_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view content drafts in their organization"
  ON public.content_drafts FOR SELECT
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert content drafts in their organization"
  ON public.content_drafts FOR INSERT
  WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update content drafts in their organization"
  ON public.content_drafts FOR UPDATE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete content drafts in their organization"
  ON public.content_drafts FOR DELETE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Trigger for updated_at
CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookups
CREATE INDEX idx_content_drafts_status ON public.content_drafts(status);
CREATE INDEX idx_content_drafts_organization ON public.content_drafts(organization_id);
CREATE INDEX idx_content_drafts_agent ON public.content_drafts(created_by_agent);