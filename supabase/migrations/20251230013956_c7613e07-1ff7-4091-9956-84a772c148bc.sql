-- Fix quotes table: restrict to organization members only (currently any authenticated user can see ALL quotes)
DROP POLICY IF EXISTS "Authenticated users can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can delete quotes" ON public.quotes;

-- Create proper organization-based policies for quotes
CREATE POLICY "Quotes: members can view"
ON public.quotes
FOR SELECT
TO authenticated
USING (
  organization_id IS NULL 
  OR is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Quotes: members can insert"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NULL 
  OR is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Quotes: members can update"
ON public.quotes
FOR UPDATE
TO authenticated
USING (
  organization_id IS NULL 
  OR is_member_of_organization(auth.uid(), organization_id)
)
WITH CHECK (
  organization_id IS NULL 
  OR is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Quotes: members can delete"
ON public.quotes
FOR DELETE
TO authenticated
USING (
  organization_id IS NULL 
  OR is_member_of_organization(auth.uid(), organization_id)
);

-- Clean up duplicate contacts policies (keep only organization-member based ones)
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON public.contacts;