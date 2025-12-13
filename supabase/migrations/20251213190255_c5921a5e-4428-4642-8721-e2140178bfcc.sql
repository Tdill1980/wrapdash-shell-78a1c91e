-- Fix infinite recursion in organization_members RLS by replacing self-referential policy

-- 1) Drop the existing problematic SELECT policy
DROP POLICY IF EXISTS "Users can view their organization members" ON public.organization_members;

-- 2) Create a SECURITY DEFINER helper function that can safely check membership
CREATE OR REPLACE FUNCTION public.is_member_of_organization(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  );
$$;

-- 3) Re-create the SELECT policy using the helper function (no self-recursion)
CREATE POLICY "Users can view their organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  public.is_member_of_organization(auth.uid(), organization_id)
  OR user_id = auth.uid()
);
