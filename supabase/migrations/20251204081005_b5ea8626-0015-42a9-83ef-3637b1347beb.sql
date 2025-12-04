-- Create generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create contacts table (centralized customer records)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT DEFAULT 'manual',
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'normal',
  last_contacted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create conversations table (unified message threads)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  channel TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_to UUID,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  sender_phone TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.shopflow_orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  assigned_to UUID,
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Contacts RLS policies
CREATE POLICY "Users can view contacts in their organization"
ON public.contacts FOR SELECT
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert contacts in their organization"
ON public.contacts FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update contacts in their organization"
ON public.contacts FOR UPDATE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete contacts in their organization"
ON public.contacts FOR DELETE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Conversations RLS policies
CREATE POLICY "Users can view conversations in their organization"
ON public.conversations FOR SELECT
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert conversations in their organization"
ON public.conversations FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update conversations in their organization"
ON public.conversations FOR UPDATE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete conversations in their organization"
ON public.conversations FOR DELETE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Messages RLS policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE organization_id = get_user_organization_id() OR organization_id IS NULL
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE organization_id = get_user_organization_id() OR organization_id IS NULL
  )
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE organization_id = get_user_organization_id() OR organization_id IS NULL
  )
);

-- Tasks RLS policies
CREATE POLICY "Users can view tasks in their organization"
ON public.tasks FOR SELECT
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert tasks in their organization"
ON public.tasks FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update tasks in their organization"
ON public.tasks FOR UPDATE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete tasks in their organization"
ON public.tasks FOR DELETE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Create indexes
CREATE INDEX idx_contacts_organization ON public.contacts(organization_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_phone ON public.contacts(phone);
CREATE INDEX idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX idx_conversations_organization ON public.conversations(organization_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_tasks_organization ON public.tasks(organization_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_contact ON public.tasks(contact_id);

-- Create triggers
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;