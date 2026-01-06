-- Drop the overly permissive policy that allows anyone to view all organizations
DROP POLICY IF EXISTS "Users can view organizations by subdomain" ON public.organizations;

-- Create a more restrictive policy that only allows:
-- 1. Authenticated users who are members of the organization
-- 2. Public access ONLY to subdomain field for routing purposes (via a function)
CREATE OR REPLACE FUNCTION public.get_organization_id_by_subdomain(subdomain_param text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.organizations WHERE subdomain = subdomain_param LIMIT 1;
$$;

-- Grant execute to anon for subdomain lookup only
GRANT EXECUTE ON FUNCTION public.get_organization_id_by_subdomain(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_organization_id_by_subdomain(text) TO authenticated;

-- Now organizations table is only viewable by members
-- The existing "Users can view their own organizations" policy already handles authenticated member access