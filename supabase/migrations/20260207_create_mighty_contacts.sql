-- VoiceCommandAI CMS - Mighty Contacts Table
-- Unified customer profiles for MightyMail and CRM

CREATE TABLE IF NOT EXISTS mighty_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core identity
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  
  -- Business info
  shop_name TEXT,
  
  -- Location (from geo tracking)
  city TEXT,
  region TEXT,
  country TEXT,
  timezone TEXT,
  address TEXT, -- Full address if provided
  
  -- Interest tracking
  last_vehicle_interest TEXT, -- Last vehicle they asked about
  vehicle_interests JSONB DEFAULT '[]', -- Array of all vehicles mentioned
  
  -- Quote/Order tracking
  has_received_quote BOOLEAN DEFAULT FALSE,
  last_quote_id UUID,
  has_ordered BOOLEAN DEFAULT FALSE,
  total_order_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Engagement tracking
  conversation_count INTEGER DEFAULT 0,
  last_conversation_id UUID,
  last_conversation_at TIMESTAMPTZ,
  
  -- Email marketing
  email_subscribed BOOLEAN DEFAULT TRUE,
  email_unsubscribed_at TIMESTAMPTZ,
  
  -- Source tracking
  source TEXT DEFAULT 'website_chat', -- website_chat, woocommerce, manual, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mighty_contacts_email ON mighty_contacts(email);
CREATE INDEX IF NOT EXISTS idx_mighty_contacts_shop_name ON mighty_contacts(shop_name);
CREATE INDEX IF NOT EXISTS idx_mighty_contacts_email_subscribed ON mighty_contacts(email_subscribed);
CREATE INDEX IF NOT EXISTS idx_mighty_contacts_has_received_quote ON mighty_contacts(has_received_quote);
CREATE INDEX IF NOT EXISTS idx_mighty_contacts_created_at ON mighty_contacts(created_at);

-- RLS Policies
ALTER TABLE mighty_contacts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all contacts
CREATE POLICY "Allow authenticated read" ON mighty_contacts
  FOR SELECT TO authenticated USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access" ON mighty_contacts
  FOR ALL TO service_role USING (true);

-- Comment
COMMENT ON TABLE mighty_contacts IS 'VoiceCommandAI CMS - Unified customer profiles built from chat data, powers MightyMail';
