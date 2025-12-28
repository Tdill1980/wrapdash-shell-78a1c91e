-- Secure contacts table (contains PII)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Remove any accidental broad access (if policies exist, leave them; new ones still apply)

-- Read: only members of the same organization
CREATE POLICY "Contacts are viewable by organization members"
ON public.contacts
FOR SELECT
USING (
  organization_id IS NOT NULL
  AND public.is_member_of_organization(auth.uid(), organization_id)
);

-- Create: only into orgs the user belongs to
CREATE POLICY "Contacts are insertable by organization members"
ON public.contacts
FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL
  AND public.is_member_of_organization(auth.uid(), organization_id)
);

-- Update: only within org
CREATE POLICY "Contacts are updatable by organization members"
ON public.contacts
FOR UPDATE
USING (
  organization_id IS NOT NULL
  AND public.is_member_of_organization(auth.uid(), organization_id)
)
WITH CHECK (
  organization_id IS NOT NULL
  AND public.is_member_of_organization(auth.uid(), organization_id)
);

-- Delete: only within org
CREATE POLICY "Contacts are deletable by organization members"
ON public.contacts
FOR DELETE
USING (
  organization_id IS NOT NULL
  AND public.is_member_of_organization(auth.uid(), organization_id)
);

-- Helpful index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts (organization_id);