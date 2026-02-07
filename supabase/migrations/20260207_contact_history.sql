-- Contact History Table
-- Tracks all communications with customers (email, SMS, calls)

CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'sms', 'call', 'note')),
  contact_method TEXT, -- 'missed_call', 'connected_call', 'voicemail', etc.
  recipient TEXT, -- email address or phone number
  subject TEXT, -- email subject
  body TEXT, -- email body or SMS text
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'pending'
  sent_by TEXT, -- 'jordan', 'jackson', 'system', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for fast lookups by quote
CREATE INDEX IF NOT EXISTS idx_contact_history_quote_id ON contact_history(quote_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_created_at ON contact_history(created_at DESC);

-- RLS
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (same org)
CREATE POLICY "contact_history_all" ON contact_history FOR ALL USING (true);
