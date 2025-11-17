-- Add tracking number field to shopflow_orders
ALTER TABLE shopflow_orders
ADD COLUMN tracking_number TEXT,
ADD COLUMN tracking_url TEXT,
ADD COLUMN shipped_at TIMESTAMPTZ;