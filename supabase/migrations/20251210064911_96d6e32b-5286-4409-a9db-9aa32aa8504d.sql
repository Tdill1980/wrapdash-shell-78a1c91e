-- Create ad_performance table for tracking paid ad metrics
CREATE TABLE public.ad_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  ad_vault_id UUID REFERENCES public.ad_vault(id) ON DELETE SET NULL,
  content_queue_id UUID REFERENCES public.content_queue(id) ON DELETE SET NULL,
  ad_type TEXT NOT NULL DEFAULT 'static' CHECK (ad_type IN ('static', 'video')),
  
  -- CORE METRICS (Raw Input)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,  -- Ad Spend / Ad Cost
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  
  -- CALCULATED METRICS
  cpc NUMERIC(10,4) DEFAULT 0,  -- Cost Per Click (spend / clicks)
  ctr NUMERIC(6,4) DEFAULT 0,  -- Click Through Rate (clicks / impressions * 100)
  conversion_rate NUMERIC(6,4) DEFAULT 0,  -- (conversions / clicks * 100)
  cost_per_conversion NUMERIC(10,2) DEFAULT 0,  -- spend / conversions
  aov NUMERIC(10,2) DEFAULT 0,  -- Average Order Value (revenue / conversions)
  roas NUMERIC(10,2) DEFAULT 0,  -- Return on Ad Spend (revenue / spend)
  
  -- Platform & Campaign Info
  platform TEXT DEFAULT 'meta',
  placement TEXT,
  campaign_name TEXT,
  ad_set_name TEXT,
  
  -- Time Tracking
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Organization-scoped access
CREATE POLICY "Users can view own org ad performance"
ON public.ad_performance FOR SELECT
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert own org ad performance"
ON public.ad_performance FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update own org ad performance"
ON public.ad_performance FOR UPDATE
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete own org ad performance"
ON public.ad_performance FOR DELETE
USING (organization_id = public.get_user_organization_id());

-- Trigger for updated_at
CREATE TRIGGER update_ad_performance_updated_at
BEFORE UPDATE ON public.ad_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_ad_performance_org ON public.ad_performance(organization_id);
CREATE INDEX idx_ad_performance_ad_vault ON public.ad_performance(ad_vault_id);
CREATE INDEX idx_ad_performance_dates ON public.ad_performance(date_range_start, date_range_end);