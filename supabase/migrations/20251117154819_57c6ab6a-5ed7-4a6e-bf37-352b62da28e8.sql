-- Create products table for WPW product catalog
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  woo_product_id integer NOT NULL UNIQUE,
  product_name text NOT NULL,
  price_per_sqft numeric,
  flat_price numeric,
  pricing_type text NOT NULL CHECK (pricing_type IN ('per_sqft', 'flat')),
  category text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
CREATE POLICY "Anyone can view products"
  ON public.products
  FOR SELECT
  USING (true);

-- Authenticated users can manage products
CREATE POLICY "Authenticated users can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products
  FOR DELETE
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_approveflow_updated_at();

-- Insert WPW products
INSERT INTO public.products (woo_product_id, product_name, price_per_sqft, flat_price, pricing_type, category, description, display_order) VALUES
  (79, 'Printed Wrap Film (Avery Brand, UV Lamination)', 5.27, NULL, 'per_sqft', 'wrap', 'Standard full-color wrap on Avery', 1),
  (72, '3M IJ180CV3 + 8518 Lamination', 5.90, NULL, 'per_sqft', 'wrap', 'Max print width 53.5"', 2),
  (108, 'Avery Cut Contour Vinyl Graphics', 6.32, NULL, 'per_sqft', 'wrap', 'Includes cutting, max artwork 50"', 3),
  (19420, '3M Cut Contour Vinyl Graphics', 6.92, NULL, 'per_sqft', 'wrap', 'Includes cutting, max artwork 50"', 4),
  (58391, 'Custom Fade Wrap Printing', NULL, 600, 'flat', 'wrap', '$600 for 2 sides', 5),
  (80, 'Perforated Window Vinyl 50/50 (Unlaminated)', 5.95, NULL, 'per_sqft', 'window', '54" roll, max print 53.5"', 6),
  (234, 'Custom Vehicle Wrap Design', NULL, 500, 'flat', 'design', 'Professional design service', 7);

-- Create settings table for install rate and tax
CREATE TABLE public.quote_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view settings"
  ON public.quote_settings
  FOR SELECT
  USING (true);

-- Authenticated users can manage settings
CREATE POLICY "Authenticated users can update settings"
  ON public.quote_settings
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can insert settings"
  ON public.quote_settings
  FOR INSERT
  WITH CHECK (true);

-- Insert default settings
INSERT INTO public.quote_settings (setting_key, setting_value) VALUES
  ('install_rate_per_hour', 75),
  ('tax_rate_percentage', 8);