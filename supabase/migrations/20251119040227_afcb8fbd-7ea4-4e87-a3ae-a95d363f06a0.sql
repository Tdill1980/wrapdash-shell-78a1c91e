-- Add product tracking to commissions table
ALTER TABLE affiliate_commissions ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Create affiliate products settings table for commission rates per product
CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default products with commission rates
INSERT INTO affiliate_products (product_name, commission_rate, display_order) VALUES
  ('WePrintWraps.com', 2.5, 1),
  ('WrapCommand AI', 20.0, 2),
  ('Ink & Edge Magazine', 20.0, 3),
  ('The Closer by DesignProAI', 10.0, 4),
  ('DesignProAI', 20.0, 5)
ON CONFLICT (product_name) DO NOTHING;

-- Enable RLS
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
CREATE POLICY "Anyone can view affiliate products"
  ON affiliate_products FOR SELECT
  USING (true);

-- Admins can manage products
CREATE POLICY "Admins can manage affiliate products"
  ON affiliate_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_product ON affiliate_commissions(product_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_founder_product ON affiliate_commissions(founder_id, product_name);