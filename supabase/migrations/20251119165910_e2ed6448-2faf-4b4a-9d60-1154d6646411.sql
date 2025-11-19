-- Phase 1: Multi-Tenant Database Architecture (Fixed)

-- Create organizations table (core multi-tenant entity)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_founder_id UUID REFERENCES affiliate_founders(id) ON DELETE SET NULL,
  branding JSONB DEFAULT '{
    "logo_url": null,
    "primary_color": "#00AFFF",
    "secondary_color": "#4EEAFF",
    "company_name": null,
    "tagline": null
  }'::jsonb,
  subscription_tier TEXT DEFAULT 'pro' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_subdomain ON public.organizations(subdomain);
CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX idx_organizations_affiliate ON public.organizations(affiliate_founder_id);

-- Create organization members table (team access)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);

-- Add organization_id to scoped tables (conditionally)
DO $$ 
BEGIN
  -- quotes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'organization_id') THEN
    ALTER TABLE public.quotes ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  -- products
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'organization_id') THEN
    ALTER TABLE public.products ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  -- shopflow_orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopflow_orders' AND column_name = 'organization_id') THEN
    ALTER TABLE public.shopflow_orders ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  -- approveflow_projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approveflow_projects' AND column_name = 'organization_id') THEN
    ALTER TABLE public.approveflow_projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  -- wrapbox_kits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wrapbox_kits' AND column_name = 'organization_id') THEN
    ALTER TABLE public.wrapbox_kits ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  -- email_retarget_customers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_retarget_customers' AND column_name = 'organization_id') THEN
    ALTER TABLE public.email_retarget_customers ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  -- email_sequences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_sequences' AND column_name = 'organization_id') THEN
    ALTER TABLE public.email_sequences ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  -- email_branding
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_branding' AND column_name = 'organization_id') THEN
    ALTER TABLE public.email_branding ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for organization scoping
CREATE INDEX IF NOT EXISTS idx_quotes_org ON public.quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_shopflow_orders_org ON public.shopflow_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_approveflow_projects_org ON public.approveflow_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_color_visualizations_org ON public.color_visualizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_wrapbox_kits_org ON public.wrapbox_kits(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_customers_org ON public.email_retarget_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_org ON public.email_sequences(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_branding_org ON public.email_branding(organization_id);

-- Helper function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- Helper function to check if user is organization owner
CREATE OR REPLACE FUNCTION public.is_organization_owner(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
      AND organization_id = _org_id 
      AND role = 'owner'
  )
$$;

-- Enable RLS on organizations tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their own organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view organizations by subdomain"
ON public.organizations FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Organization owners can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (is_organization_owner(id));

CREATE POLICY "Anyone can create organizations during signup"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Organization members policies
CREATE POLICY "Users can view their organization members"
ON public.organization_members FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can manage members"
ON public.organization_members FOR ALL
TO authenticated
USING (is_organization_owner(organization_id));

CREATE POLICY "Users can be added as organization members"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger to update organizations.updated_at
CREATE OR REPLACE FUNCTION public.update_organizations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_organizations_updated_at();

-- Create "main" organization for existing data
INSERT INTO public.organizations (subdomain, name, subscription_tier, is_active)
VALUES ('main', 'WrapCommand AI', 'enterprise', true);