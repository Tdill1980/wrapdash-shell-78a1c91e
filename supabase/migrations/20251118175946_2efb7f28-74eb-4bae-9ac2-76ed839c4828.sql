-- Add customer tracking columns to shopflow_orders
ALTER TABLE public.shopflow_orders 
ADD COLUMN IF NOT EXISTS customer_stage text DEFAULT 'order_received',
ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS vehicle_info jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS preflight_status text,
ADD COLUMN IF NOT EXISTS file_error_details jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS missing_file_list jsonb DEFAULT '[]'::jsonb;

-- Add index for customer tracking lookups
CREATE INDEX IF NOT EXISTS idx_shopflow_customer_email ON public.shopflow_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_shopflow_customer_stage ON public.shopflow_orders(customer_stage);

-- Add comment
COMMENT ON COLUMN public.shopflow_orders.customer_stage IS 'Customer-facing production stage for public tracking';
COMMENT ON COLUMN public.shopflow_orders.timeline IS 'JSON object storing timestamps for each stage transition';
COMMENT ON COLUMN public.shopflow_orders.files IS 'Array of file objects with status and URLs';