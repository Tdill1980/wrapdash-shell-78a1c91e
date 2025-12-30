-- Enable RLS on email_retarget_customers table
ALTER TABLE public.email_retarget_customers ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view customers in their organization
CREATE POLICY "Email retarget: members can view"
ON public.email_retarget_customers
FOR SELECT
TO authenticated
USING (
  is_member_of_organization(auth.uid(), organization_id)
);

-- Policy: Members can insert customers in their organization
CREATE POLICY "Email retarget: members can insert"
ON public.email_retarget_customers
FOR INSERT
TO authenticated
WITH CHECK (
  is_member_of_organization(auth.uid(), organization_id)
);

-- Policy: Members can update customers in their organization
CREATE POLICY "Email retarget: members can update"
ON public.email_retarget_customers
FOR UPDATE
TO authenticated
USING (
  is_member_of_organization(auth.uid(), organization_id)
)
WITH CHECK (
  is_member_of_organization(auth.uid(), organization_id)
);

-- Policy: Members can delete customers in their organization
CREATE POLICY "Email retarget: members can delete"
ON public.email_retarget_customers
FOR DELETE
TO authenticated
USING (
  is_member_of_organization(auth.uid(), organization_id)
);