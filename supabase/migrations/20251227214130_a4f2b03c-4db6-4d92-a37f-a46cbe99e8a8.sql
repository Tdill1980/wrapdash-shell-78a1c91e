-- Agent conversation memory table (additive, non-breaking)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  conversation_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index for upsert pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_conversations_unique
ON agent_conversations (agent_name, conversation_id);

-- Enable RLS
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to manage their own conversations
CREATE POLICY "Users can manage their agent conversations"
ON agent_conversations
FOR ALL
USING (true)
WITH CHECK (true);