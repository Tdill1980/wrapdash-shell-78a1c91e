-- Create ad_vault table for storing rendered static ads
CREATE TABLE public.ad_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  placement TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('template', 'ai')),
  png_url TEXT NOT NULL,
  template_id TEXT,
  layout_json JSONB,
  headline TEXT,
  primary_text TEXT,
  cta TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_vault ENABLE ROW LEVEL SECURITY;

-- Owner-only access policies (only org owners can view/manage their ads)
CREATE POLICY "Organization owners can view their ads"
  ON public.ad_vault
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Organization owners can create ads"
  ON public.ad_vault
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Organization owners can delete their ads"
  ON public.ad_vault
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Index for fast org lookups
CREATE INDEX idx_ad_vault_organization ON public.ad_vault(organization_id);
CREATE INDEX idx_ad_vault_type ON public.ad_vault(type);
CREATE INDEX idx_ad_vault_placement ON public.ad_vault(placement);