-- Fix conversations table: Remove overly permissive policies that allow NULL organization_id access
-- and replace with strict organization membership checks

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations in their organization" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations in their organization" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete conversations in their organization" ON public.conversations;

-- Create strict organization-based policies
CREATE POLICY "Conversations: members can view"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Conversations: members can insert"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NOT NULL 
  AND is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Conversations: members can update"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND is_member_of_organization(auth.uid(), organization_id)
)
WITH CHECK (
  organization_id IS NOT NULL 
  AND is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Conversations: members can delete"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND is_member_of_organization(auth.uid(), organization_id)
);