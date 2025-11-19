-- Add constraint to enforce product_type values
ALTER TABLE products
ADD CONSTRAINT product_type_enum
CHECK (product_type IN ('wpw', 'quote-only'));

-- Set is_locked default to true for stability
ALTER TABLE products
ALTER COLUMN is_locked SET DEFAULT true;