-- Add visibility column to products table for organization-level control
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'all';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Add constraint for visibility values
ALTER TABLE public.products ADD CONSTRAINT products_visibility_check 
  CHECK (visibility IN ('all', 'organization', 'hidden'));

-- Drop existing permissive policies on products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view active products" ON public.products;

-- Create new RLS policies for multi-tenant product access
-- Users can view: their org's products OR global products (org_id IS NULL) that aren't hidden
CREATE POLICY "Users can view accessible products" 
ON public.products 
FOR SELECT 
USING (
  (organization_id = get_user_organization_id() AND visibility != 'hidden')
  OR (organization_id IS NULL AND visibility != 'hidden')
  OR has_role(auth.uid(), 'admin')
);

-- Users can insert products for their organization
CREATE POLICY "Users can create products for their organization" 
ON public.products 
FOR INSERT 
WITH CHECK (
  organization_id = get_user_organization_id()
  OR has_role(auth.uid(), 'admin')
);

-- Users can update their org's products OR admins can update global products
CREATE POLICY "Users can update their organization products" 
ON public.products 
FOR UPDATE 
USING (
  (organization_id = get_user_organization_id() AND is_locked = false)
  OR (organization_id IS NULL AND has_role(auth.uid(), 'admin'))
);

-- Users can delete their org's products (soft delete via is_active)
CREATE POLICY "Users can delete their organization products" 
ON public.products 
FOR DELETE 
USING (
  (organization_id = get_user_organization_id() AND is_locked = false)
  OR has_role(auth.uid(), 'admin')
);

-- Create organization_product_settings table for reseller preferences
CREATE TABLE IF NOT EXISTS public.organization_product_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) NOT NULL UNIQUE,
  show_wpw_wholesale boolean DEFAULT true,
  default_margin_percentage numeric DEFAULT 65,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on organization_product_settings
ALTER TABLE public.organization_product_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_product_settings
CREATE POLICY "Users can view their org settings" 
ON public.organization_product_settings 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert their org settings" 
ON public.organization_product_settings 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their org settings" 
ON public.organization_product_settings 
FOR UPDATE 
USING (organization_id = get_user_organization_id());

-- Add index for faster organization-based queries
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON public.products(visibility);