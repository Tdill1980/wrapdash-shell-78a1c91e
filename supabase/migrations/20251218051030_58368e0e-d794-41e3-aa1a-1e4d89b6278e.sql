-- Revenue Health Status table - single source of truth for system health
CREATE TABLE public.revenue_health_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Campaign Heartbeat
  last_email_campaign_at TIMESTAMP WITH TIME ZONE,
  last_sms_campaign_at TIMESTAMP WITH TIME ZONE,
  days_since_email INTEGER DEFAULT 0,
  days_since_sms INTEGER DEFAULT 0,
  campaign_status TEXT DEFAULT 'healthy' CHECK (campaign_status IN ('healthy', 'warning', 'critical', 'emergency')),
  
  -- Signal Health
  klaviyo_meta_sync_active BOOLEAN DEFAULT false,
  last_signal_sync_at TIMESTAMP WITH TIME ZONE,
  signal_freshness_score INTEGER DEFAULT 0 CHECK (signal_freshness_score >= 0 AND signal_freshness_score <= 100),
  signal_status TEXT DEFAULT 'unknown' CHECK (signal_status IN ('healthy', 'warning', 'critical', 'unknown')),
  synced_segments JSONB DEFAULT '[]'::jsonb,
  
  -- Overall Health
  overall_status TEXT DEFAULT 'unknown' CHECK (overall_status IN ('green', 'yellow', 'red')),
  requires_action BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign Heartbeat Log - tracks all outbound activations
CREATE TABLE public.campaign_heartbeat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push')),
  campaign_name TEXT NOT NULL,
  campaign_source TEXT DEFAULT 'klaviyo' CHECK (campaign_source IN ('klaviyo', 'mightymail', 'resend', 'manual')),
  
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  audience_size INTEGER,
  
  -- Performance (updated later)
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Signal Sync Log - tracks Klaviyo → Meta syncs
CREATE TABLE public.signal_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  
  sync_type TEXT NOT NULL DEFAULT 'klaviyo_meta',
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'partial')),
  
  segments_synced JSONB DEFAULT '[]'::jsonb,
  profiles_synced INTEGER DEFAULT 0,
  
  error_message TEXT,
  
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Accountability Overrides - logs when someone bypasses the guardrail
CREATE TABLE public.accountability_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  
  override_type TEXT NOT NULL CHECK (override_type IN ('budget_increase', 'new_campaign', 'boosted_post', 'ignore_warning')),
  override_reason TEXT NOT NULL,
  
  overridden_by UUID,
  overridden_by_name TEXT,
  
  warning_level TEXT,
  days_since_campaign INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auto-Recovery Campaigns - generated campaigns ready to send
CREATE TABLE public.auto_recovery_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('warning', 'critical', 'emergency', 'manual')),
  campaign_type TEXT NOT NULL DEFAULT 'email',
  
  -- Generated content
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  email_html TEXT,
  sms_copy TEXT,
  suggested_segments JSONB DEFAULT '[]'::jsonb,
  meta_ad_copy TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'rejected', 'expired')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.revenue_health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_heartbeat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_recovery_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Authenticated users can manage their org's data
CREATE POLICY "Users can view their org health status" ON public.revenue_health_status
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert health status" ON public.revenue_health_status
  FOR INSERT WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update health status" ON public.revenue_health_status
  FOR UPDATE USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can view campaign heartbeat" ON public.campaign_heartbeat
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert campaign heartbeat" ON public.campaign_heartbeat
  FOR INSERT WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can view signal sync logs" ON public.signal_sync_log
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert signal sync logs" ON public.signal_sync_log
  FOR INSERT WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can view accountability overrides" ON public.accountability_overrides
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert accountability overrides" ON public.accountability_overrides
  FOR INSERT WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can view auto recovery campaigns" ON public.auto_recovery_campaigns
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can manage auto recovery campaigns" ON public.auto_recovery_campaigns
  FOR ALL USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Trigger for updated_at
CREATE TRIGGER update_revenue_health_status_updated_at
  BEFORE UPDATE ON public.revenue_health_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();