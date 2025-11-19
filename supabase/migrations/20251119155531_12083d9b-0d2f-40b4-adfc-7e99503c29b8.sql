-- Make woo_product_id nullable to support quote-only products
ALTER TABLE public.products 
ALTER COLUMN woo_product_id DROP NOT NULL;

-- Add product_type and is_locked columns to products table
ALTER TABLE public.products 
ADD COLUMN product_type TEXT NOT NULL DEFAULT 'wpw' CHECK (product_type IN ('wpw', 'quote-only')),
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false;

-- Mark existing WPW products as locked
UPDATE public.products 
SET is_locked = true, product_type = 'wpw' 
WHERE woo_product_id IS NOT NULL;

-- Insert quote-only products for Full Wraps
INSERT INTO public.products (product_name, category, pricing_type, price_per_sqft, product_type, is_locked, display_order, woo_product_id) VALUES
('Avery Dennison SW900 Gloss', 'full-wraps', 'per_sqft', 8.50, 'quote-only', true, 100, NULL),
('Avery Dennison SW900 Satin', 'full-wraps', 'per_sqft', 8.50, 'quote-only', true, 101, NULL),
('Avery Dennison SW900 Matte', 'full-wraps', 'per_sqft', 8.50, 'quote-only', true, 102, NULL),
('3M 2080 Gloss', 'full-wraps', 'per_sqft', 8.00, 'quote-only', true, 103, NULL),
('3M 2080 Satin', 'full-wraps', 'per_sqft', 8.00, 'quote-only', true, 104, NULL),
('3M 2080 Matte', 'full-wraps', 'per_sqft', 8.00, 'quote-only', true, 105, NULL),
('Arlon 6100X RP', 'full-wraps', 'per_sqft', 7.50, 'quote-only', true, 106, NULL);

-- Insert quote-only products for PPF
INSERT INTO public.products (product_name, category, pricing_type, price_per_sqft, product_type, is_locked, display_order, woo_product_id) VALUES
('STEK PPF Gloss', 'ppf', 'per_sqft', 12.00, 'quote-only', true, 200, NULL),
('STEK PPF Matte', 'ppf', 'per_sqft', 13.00, 'quote-only', true, 201, NULL),
('GSWF PPF Gloss', 'ppf', 'per_sqft', 11.00, 'quote-only', true, 202, NULL),
('GSWF PPF Matte', 'ppf', 'per_sqft', 12.00, 'quote-only', true, 203, NULL),
('GSWF Color PPF', 'ppf', 'per_sqft', 14.00, 'quote-only', true, 204, NULL),
('SunTek PPF', 'ppf', 'per_sqft', 11.50, 'quote-only', true, 205, NULL),
('XPEL PPF', 'ppf', 'per_sqft', 12.50, 'quote-only', true, 206, NULL),
('Avery PPF', 'ppf', 'per_sqft', 11.00, 'quote-only', true, 207, NULL);

-- Insert quote-only products for Window Tint
INSERT INTO public.products (product_name, category, pricing_type, flat_price, product_type, is_locked, display_order, woo_product_id) VALUES
('Carbon Window Tint', 'window-tint', 'flat', 250.00, 'quote-only', true, 300, NULL),
('Ceramic Window Tint', 'window-tint', 'flat', 350.00, 'quote-only', true, 301, NULL),
('IR Ceramic Window Tint', 'window-tint', 'flat', 450.00, 'quote-only', true, 302, NULL),
('Windshield Only Tint', 'window-tint', 'flat', 150.00, 'quote-only', true, 303, NULL),
('Front 2 Windows Tint', 'window-tint', 'flat', 180.00, 'quote-only', true, 304, NULL),
('Full SUV Tint', 'window-tint', 'flat', 400.00, 'quote-only', true, 305, NULL);

-- Insert quote-only products for Partial Wraps
INSERT INTO public.products (product_name, category, pricing_type, price_per_sqft, product_type, is_locked, display_order, woo_product_id) VALUES
('Hood Only Wrap', 'partial-wraps', 'per_sqft', 8.00, 'quote-only', true, 400, NULL),
('Roof Only Wrap', 'partial-wraps', 'per_sqft', 8.00, 'quote-only', true, 401, NULL),
('Pillars Wrap', 'partial-wraps', 'per_sqft', 8.00, 'quote-only', true, 402, NULL),
('Accent Panels Custom', 'partial-wraps', 'per_sqft', 8.00, 'quote-only', true, 403, NULL);

-- Insert quote-only products for Chrome Delete
INSERT INTO public.products (product_name, category, pricing_type, flat_price, product_type, is_locked, display_order, woo_product_id) VALUES
('Full Vehicle Chrome Delete', 'chrome-delete', 'flat', 400.00, 'quote-only', true, 500, NULL),
('Window Trim Chrome Delete', 'chrome-delete', 'flat', 200.00, 'quote-only', true, 501, NULL),
('Door Handles Chrome Delete', 'chrome-delete', 'flat', 150.00, 'quote-only', true, 502, NULL);