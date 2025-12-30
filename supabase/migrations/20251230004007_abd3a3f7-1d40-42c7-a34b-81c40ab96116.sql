-- Enable RLS on contacts table (if not already enabled)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to recreate them
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON public.contacts;

-- Create RLS policies for contacts - only organization members can access
CREATE POLICY "Users can view contacts in their organization" 
ON public.contacts 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create contacts in their organization" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update contacts in their organization" 
ON public.contacts 
FOR UPDATE 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete contacts in their organization" 
ON public.contacts 
FOR DELETE 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);