-- Create klaviyo_campaigns table to track all programmatically created campaigns
CREATE TABLE public.klaviyo_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  klaviyo_campaign_id TEXT,
  klaviyo_template_id TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'winback',
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  segment_type TEXT DEFAULT '30_day_inactive',
  status TEXT DEFAULT 'draft',
  ai_generated BOOLEAN DEFAULT true,
  offer_type TEXT,
  offer_value INTEGER,
  html_content TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create winback_sequences table for multi-email sequences
CREATE TABLE public.winback_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  sequence_name TEXT NOT NULL,
  trigger_days_inactive INTEGER NOT NULL DEFAULT 30,
  emails_in_sequence INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  total_revenue NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email_design_tokens table for Ink & Edge aesthetic
CREATE TABLE public.email_design_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  token_name TEXT NOT NULL,
  background_color TEXT DEFAULT '#0A0A0A',
  headline_color TEXT DEFAULT '#FF1493',
  accent_color TEXT DEFAULT '#FFD700',
  cta_color TEXT DEFAULT '#00AFFF',
  text_color TEXT DEFAULT '#FFFFFF',
  headline_font TEXT DEFAULT 'Bebas Neue',
  body_font TEXT DEFAULT 'Inter',
  logo_url TEXT,
  footer_html TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.klaviyo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_design_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for klaviyo_campaigns
CREATE POLICY "Users can view campaigns in their organization" ON public.klaviyo_campaigns
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert campaigns in their organization" ON public.klaviyo_campaigns
  FOR INSERT WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update campaigns in their organization" ON public.klaviyo_campaigns
  FOR UPDATE USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete campaigns in their organization" ON public.klaviyo_campaigns
  FOR DELETE USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- RLS policies for winback_sequences
CREATE POLICY "Users can view sequences in their organization" ON public.winback_sequences
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert sequences in their organization" ON public.winback_sequences
  FOR INSERT WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update sequences in their organization" ON public.winback_sequences
  FOR UPDATE USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete sequences in their organization" ON public.winback_sequences
  FOR DELETE USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- RLS policies for email_design_tokens
CREATE POLICY "Users can view design tokens in their organization" ON public.email_design_tokens
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert design tokens in their organization" ON public.email_design_tokens
  FOR INSERT WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update design tokens in their organization" ON public.email_design_tokens
  FOR UPDATE USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete design tokens in their organization" ON public.email_design_tokens
  FOR DELETE USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Insert default Ink & Edge design token
INSERT INTO public.email_design_tokens (
  token_name, background_color, headline_color, accent_color, cta_color, text_color,
  headline_font, body_font, is_default,
  footer_html
) VALUES (
  'ink_edge_dark',
  '#0A0A0A',
  '#FF1493',
  '#FFD700',
  '#00AFFF',
  '#FFFFFF',
  'Bebas Neue',
  'Inter',
  true,
  '<p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">WePrintWraps.com | Premium Wrap Printing<br/>Questions? hello@weprintwraps.com</p>'
);

-- Insert default winback sequences
INSERT INTO public.winback_sequences (sequence_name, trigger_days_inactive, emails_in_sequence) VALUES
  ('30-Day WinBack', 30, 3),
  ('60-Day WinBack', 60, 3),
  ('90-Day WinBack', 90, 2);

-- Add triggers for updated_at
CREATE TRIGGER update_klaviyo_campaigns_updated_at
  BEFORE UPDATE ON public.klaviyo_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_winback_sequences_updated_at
  BEFORE UPDATE ON public.winback_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_design_tokens_updated_at
  BEFORE UPDATE ON public.email_design_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();