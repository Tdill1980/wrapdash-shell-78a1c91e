-- Create organization_tradedna table for TradeDNA™ Brand Voice Wizard
CREATE TABLE public.organization_tradedna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Business Identity (Wizard Step 1 inputs)
  business_name TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  facebook_page TEXT,
  youtube_channel TEXT,
  tiktok_handle TEXT,
  tagline TEXT,
  business_category TEXT,
  
  -- Scraped/Pasted Raw Content (for re-analysis)
  scraped_content JSONB DEFAULT '{}',
  
  -- The Core TradeDNA Profile JSON
  tradedna_profile JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_analyzed_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_tradedna ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view TradeDNA for their organization"
  ON public.organization_tradedna FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert TradeDNA for their organization"
  ON public.organization_tradedna FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update TradeDNA for their organization"
  ON public.organization_tradedna FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete TradeDNA for their organization"
  ON public.organization_tradedna FOR DELETE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_organization_tradedna_updated_at
  BEFORE UPDATE ON public.organization_tradedna
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();