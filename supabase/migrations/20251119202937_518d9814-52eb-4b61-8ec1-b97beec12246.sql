-- Add product_image_url column to shopflow_orders table
ALTER TABLE public.shopflow_orders 
ADD COLUMN IF NOT EXISTS product_image_url TEXT;