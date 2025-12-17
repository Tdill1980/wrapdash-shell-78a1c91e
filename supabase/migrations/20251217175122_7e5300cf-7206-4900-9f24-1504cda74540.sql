-- Agent Chat System Tables
-- For conversational clarification before task delegation

-- Table: agent_chats (conversation-level)
CREATE TABLE agent_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  user_id uuid NOT NULL,
  agent_id text NOT NULL,
  status text DEFAULT 'clarifying' CHECK (status IN ('clarifying', 'confirmed', 'delegated', 'executed', 'closed')),
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: agent_chat_messages (message-level)
CREATE TABLE agent_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_chat_id uuid REFERENCES agent_chats(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'agent')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table: delegation_log (immutable audit trail)
CREATE TABLE delegation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_chat_id uuid REFERENCES agent_chats(id),
  task_id uuid REFERENCES tasks(id),
  delegated_by text NOT NULL,
  summary text NOT NULL,
  delegated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agent_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_chats
CREATE POLICY "Users can view their org agent chats"
  ON agent_chats FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can create agent chats"
  ON agent_chats FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update their org agent chats"
  ON agent_chats FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for agent_chat_messages
CREATE POLICY "Users can view messages in their chats"
  ON agent_chat_messages FOR SELECT
  USING (agent_chat_id IN (SELECT id FROM agent_chats WHERE organization_id = get_user_organization_id() OR organization_id IS NULL));

CREATE POLICY "Users can insert messages in their chats"
  ON agent_chat_messages FOR INSERT
  WITH CHECK (agent_chat_id IN (SELECT id FROM agent_chats WHERE organization_id = get_user_organization_id() OR organization_id IS NULL));

-- RLS Policies for delegation_log
CREATE POLICY "Users can view their org delegation logs"
  ON delegation_log FOR SELECT
  USING (agent_chat_id IN (SELECT id FROM agent_chats WHERE organization_id = get_user_organization_id() OR organization_id IS NULL));

CREATE POLICY "Users can create delegation logs"
  ON delegation_log FOR INSERT
  WITH CHECK (agent_chat_id IN (SELECT id FROM agent_chats WHERE organization_id = get_user_organization_id() OR organization_id IS NULL));

-- Indexes for performance
CREATE INDEX idx_agent_chats_org ON agent_chats(organization_id);
CREATE INDEX idx_agent_chats_agent ON agent_chats(agent_id);
CREATE INDEX idx_agent_chats_status ON agent_chats(status);
CREATE INDEX idx_agent_chat_messages_chat ON agent_chat_messages(agent_chat_id);
CREATE INDEX idx_delegation_log_chat ON delegation_log(agent_chat_id);

-- Trigger for updated_at
CREATE TRIGGER update_agent_chats_updated_at
  BEFORE UPDATE ON agent_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();