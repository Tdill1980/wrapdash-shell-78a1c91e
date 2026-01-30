-- Add shipping location columns to shopflow_orders
ALTER TABLE public.shopflow_orders 
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_state TEXT;