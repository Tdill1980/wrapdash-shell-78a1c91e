-- Enable RLS on execution_receipts table
ALTER TABLE public.execution_receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their own execution receipts
CREATE POLICY "Organization members can view execution receipts"
ON public.execution_receipts
FOR SELECT
TO authenticated
USING (public.is_member_of_organization(auth.uid(), organization_id));

-- Policy: Organization members can insert execution receipts for their org
CREATE POLICY "Organization members can insert execution receipts"
ON public.execution_receipts
FOR INSERT
TO authenticated
WITH CHECK (public.is_member_of_organization(auth.uid(), organization_id));

-- Policy: Organization members can update their own execution receipts
CREATE POLICY "Organization members can update execution receipts"
ON public.execution_receipts
FOR UPDATE
TO authenticated
USING (public.is_member_of_organization(auth.uid(), organization_id));

-- Policy: Organization members can delete their own execution receipts
CREATE POLICY "Organization members can delete execution receipts"
ON public.execution_receipts
FOR DELETE
TO authenticated
USING (public.is_member_of_organization(auth.uid(), organization_id));