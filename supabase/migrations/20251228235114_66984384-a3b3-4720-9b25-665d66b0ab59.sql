-- Tighten RLS policies to prevent public/anon access

-- CONTACTS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='contacts'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contacts', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Contacts: members can view"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Contacts: members can insert"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "Contacts: members can update"
ON public.contacts
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

CREATE POLICY "Contacts: members can delete"
ON public.contacts
FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL
  AND is_member_of_organization(auth.uid(), organization_id)
);

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='messages'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Messages: members can view"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id IS NOT NULL
      AND is_member_of_organization(auth.uid(), c.organization_id)
  )
);

CREATE POLICY "Messages: members can insert"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id IS NOT NULL
      AND is_member_of_organization(auth.uid(), c.organization_id)
  )
);

CREATE POLICY "Messages: members can update"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id IS NOT NULL
      AND is_member_of_organization(auth.uid(), c.organization_id)
  )
);

CREATE POLICY "Messages: members can delete"
ON public.messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id IS NOT NULL
      AND is_member_of_organization(auth.uid(), c.organization_id)
  )
);

-- AI ACTIONS
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='ai_actions'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_actions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "AI actions: members can view"
ON public.ai_actions
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "AI actions: members can insert"
ON public.ai_actions
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "AI actions: members can update"
ON public.ai_actions
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

CREATE POLICY "AI actions: members can delete"
ON public.ai_actions
FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL
  AND is_member_of_organization(auth.uid(), organization_id)
);

-- Optional: helpful indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON public.contacts (organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON public.conversations (organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_org_id ON public.ai_actions (organization_id);
