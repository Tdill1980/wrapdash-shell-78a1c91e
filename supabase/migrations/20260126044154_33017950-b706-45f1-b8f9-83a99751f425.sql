-- Create organization_phone_settings table for multi-tenant phone agent
CREATE TABLE public.organization_phone_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Twilio Configuration
  twilio_phone_number TEXT,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  
  -- Alert Configuration  
  alert_phone_number TEXT NOT NULL,
  alert_email TEXT,
  
  -- AI Greeting Customization
  company_name TEXT DEFAULT 'our company',
  ai_agent_name TEXT DEFAULT 'Jordan',
  greeting_message TEXT,
  
  -- Feature Flags
  phone_agent_enabled BOOLEAN DEFAULT false,
  sms_alerts_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_phone_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view phone settings"
  ON public.organization_phone_settings FOR SELECT
  USING (public.is_member_of_organization(auth.uid(), organization_id));

CREATE POLICY "Org owners can insert phone settings"
  ON public.organization_phone_settings FOR INSERT
  WITH CHECK (public.is_organization_owner(organization_id));

CREATE POLICY "Org owners can update phone settings"
  ON public.organization_phone_settings FOR UPDATE
  USING (public.is_organization_owner(organization_id));

CREATE POLICY "Org owners can delete phone settings"
  ON public.organization_phone_settings FOR DELETE
  USING (public.is_organization_owner(organization_id));

-- Trigger for updated_at
CREATE TRIGGER update_organization_phone_settings_updated_at
  BEFORE UPDATE ON public.organization_phone_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add organization_id to phone_calls if not exists
ALTER TABLE public.phone_calls 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);