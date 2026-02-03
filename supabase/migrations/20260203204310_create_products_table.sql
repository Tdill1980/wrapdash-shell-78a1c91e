-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  woo_product_id INTEGER,
  product_name TEXT NOT NULL,
  price_per_sqft DECIMAL(10,2),
  flat_price DECIMAL(10,2),
  pricing_type TEXT DEFAULT 'per_sqft' CHECK (pricing_type IN ('per_sqft', 'flat')),
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  product_type TEXT DEFAULT 'wpw' CHECK (product_type IN ('wpw', 'quote-only')),
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quote_settings table
CREATE TABLE IF NOT EXISTS public.quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;

-- Policies for products (public read, authenticated write)
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE USING (true);

-- Policies for quote_settings (public read, authenticated write)
CREATE POLICY "Anyone can view quote_settings" ON public.quote_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update quote_settings" ON public.quote_settings FOR UPDATE USING (true);

-- Insert default quote settings
INSERT INTO public.quote_settings (setting_key, setting_value) VALUES
  ('install_rate_per_hour', 75.00),
  ('tax_rate_percentage', 8.00)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert WPW products from wpwProducts.ts
INSERT INTO public.products (woo_product_id, product_name, price_per_sqft, flat_price, pricing_type, category, description, display_order, product_type, is_locked) VALUES
  -- Printed Wrap Films
  (79, 'Avery MPI 1105 with DOL 1460Z', 5.27, NULL, 'per_sqft', 'full-wraps', 'Premium printed wrap film', 1, 'wpw', true),
  (72, '3M IJ180Cv3 with 8518', 5.27, NULL, 'per_sqft', 'full-wraps', 'Premium 3M printed wrap film', 2, 'wpw', true),

  -- Contour Cut (Install-Ready)
  (108, 'Avery Contour-Cut', 6.32, NULL, 'per_sqft', 'full-wraps', 'Install-ready contour cut', 3, 'wpw', true),
  (19420, '3M Contour-Cut', 6.92, NULL, 'per_sqft', 'full-wraps', '3M install-ready contour cut', 4, 'wpw', true),

  -- Specialty Products
  (80, 'Perforated Window Vinyl 50/50', 5.95, NULL, 'per_sqft', 'partial-wraps', 'Window perf for see-through graphics', 5, 'wpw', true),
  (58391, 'FadeWraps Pre-Designed', NULL, 600.00, 'flat', 'full-wraps', 'Pre-designed fade graphics ($600-$990)', 6, 'wpw', true),
  (69439, 'InkFusion Premium', NULL, 2075.00, 'flat', 'full-wraps', 'Premium InkFusion roll (375 sqft)', 7, 'wpw', true),
  (70093, 'Wall Wrap Printed Vinyl', 3.25, NULL, 'per_sqft', 'full-wraps', 'Avery HP MPI 2610 wall graphics', 8, 'wpw', true),

  -- Wrap By The Yard
  (1726, 'Camo & Carbon', NULL, 95.50, 'flat', 'partial-wraps', 'Pre-designed patterns by the yard', 9, 'wpw', true),
  (39698, 'Metal & Marble', NULL, 95.50, 'flat', 'partial-wraps', 'Pre-designed patterns by the yard', 10, 'wpw', true),
  (4181, 'Wicked & Wild', NULL, 95.50, 'flat', 'partial-wraps', 'Pre-designed patterns by the yard', 11, 'wpw', true),
  (42809, 'Bape Camo', NULL, 95.50, 'flat', 'partial-wraps', 'Pre-designed patterns by the yard', 12, 'wpw', true),
  (52489, 'Modern & Trippy', NULL, 95.50, 'flat', 'partial-wraps', 'Pre-designed patterns by the yard', 13, 'wpw', true),

  -- Design Services
  (234, 'Custom Vehicle Wrap Design', NULL, 750.00, 'flat', 'full-wraps', 'Full custom design service', 14, 'wpw', true),
  (58160, 'Custom Design (Copy/Draft)', NULL, 500.00, 'flat', 'full-wraps', 'Design copy/draft service', 15, 'wpw', true),

  -- Sample/Reference Products
  (15192, 'Pantone Color Chart', NULL, 42.00, 'flat', 'partial-wraps', 'Color matching reference', 16, 'wpw', true),
  (475, 'Camo & Carbon Sample Book', NULL, 26.50, 'flat', 'partial-wraps', 'Pattern sample book', 17, 'wpw', true),
  (39628, 'Marble & Metals Swatch Book', NULL, 26.50, 'flat', 'partial-wraps', 'Pattern sample book', 18, 'wpw', true),
  (4179, 'Wicked & Wild Swatch Book', NULL, 26.50, 'flat', 'partial-wraps', 'Pattern sample book', 19, 'wpw', true),

  -- DesignPanelPro (Print Production Packs)
  (69664, 'Small Print Production Pack', NULL, 299.00, 'flat', 'full-wraps', 'Small production pack', 20, 'wpw', true),
  (69671, 'Medium Print Production Pack', NULL, 499.00, 'flat', 'full-wraps', 'Medium production pack', 21, 'wpw', true),
  (69680, 'Large Print Production Pack', NULL, 699.00, 'flat', 'full-wraps', 'Large production pack', 22, 'wpw', true),
  (69686, 'XLarge Print Production Pack', NULL, 899.00, 'flat', 'full-wraps', 'XLarge production pack', 23, 'wpw', true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_woo_product_id ON public.products(woo_product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Enable realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_settings;
