-- Add payment tracking columns to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_notes text,
ADD COLUMN IF NOT EXISTS shopflow_order_id uuid REFERENCES shopflow_orders(id),
ADD COLUMN IF NOT EXISTS approveflow_project_id uuid REFERENCES approveflow_projects(id),
ADD COLUMN IF NOT EXISTS artwork_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS artwork_status text DEFAULT 'none';

-- Add source tracking to shopflow_orders
ALTER TABLE shopflow_orders
ADD COLUMN IF NOT EXISTS source_quote_id uuid REFERENCES quotes(id);

-- Add index for payment queries
CREATE INDEX IF NOT EXISTS idx_quotes_is_paid ON quotes(is_paid) WHERE is_paid = true;

-- Add index for source quote lookups
CREATE INDEX IF NOT EXISTS idx_shopflow_orders_source_quote ON shopflow_orders(source_quote_id) WHERE source_quote_id IS NOT NULL;