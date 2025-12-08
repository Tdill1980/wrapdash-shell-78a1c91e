-- Add order_total column to shopflow_orders for revenue tracking
ALTER TABLE public.shopflow_orders 
ADD COLUMN IF NOT EXISTS order_total numeric DEFAULT 0;

-- Add index for revenue queries
CREATE INDEX IF NOT EXISTS idx_shopflow_orders_created_at ON public.shopflow_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shopflow_orders_status ON public.shopflow_orders(status);