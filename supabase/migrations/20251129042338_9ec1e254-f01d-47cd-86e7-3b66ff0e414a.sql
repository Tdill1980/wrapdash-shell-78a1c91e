-- Add dual pricing columns to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS wholesale_cost NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_price NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS reseller_profit NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS installation_included BOOLEAN DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS installation_cost NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS installation_description TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS installation_hours NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS installation_rate NUMERIC;

-- Create margin_settings table for granular margin control
CREATE TABLE IF NOT EXISTS margin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  scope TEXT NOT NULL, -- 'global', 'category', 'product'
  scope_value TEXT, -- category name or product_id
  margin_percentage NUMERIC NOT NULL DEFAULT 65,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, scope, scope_value)
);

-- Enable RLS on margin_settings
ALTER TABLE margin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view margin settings
CREATE POLICY "Authenticated users can view margin settings"
ON margin_settings FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert margin settings
CREATE POLICY "Authenticated users can insert margin settings"
ON margin_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update margin settings
CREATE POLICY "Authenticated users can update margin settings"
ON margin_settings FOR UPDATE
TO authenticated
USING (true);

-- Insert default global margin for WePrintWraps organization if it doesn't exist
INSERT INTO margin_settings (organization_id, scope, scope_value, margin_percentage)
SELECT id, 'global', NULL, 65
FROM organizations
WHERE subdomain = 'weprintwraps'
ON CONFLICT (organization_id, scope, scope_value) DO NOTHING;