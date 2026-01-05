-- Phase 2: Add payment tracking columns to shopflow_orders
ALTER TABLE public.shopflow_orders 
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS woo_date_paid timestamptz,
ADD COLUMN IF NOT EXISTS woo_status_raw text;

-- Create index for efficient filtering of hidden/unpaid orders
CREATE INDEX IF NOT EXISTS idx_shopflow_orders_is_paid ON public.shopflow_orders(is_paid);
CREATE INDEX IF NOT EXISTS idx_shopflow_orders_hidden ON public.shopflow_orders(hidden);

-- Phase 3: Mark existing unpaid orders as hidden
-- Orders that came in with pending/failed/on-hold/cancelled woo status should be hidden
UPDATE public.shopflow_orders so
SET 
  hidden = true, 
  is_paid = false,
  woo_status_raw = COALESCE(
    (SELECT sl.payload->>'woo_status' 
     FROM public.shopflow_logs sl 
     WHERE sl.order_id = so.id 
       AND sl.event_type = 'job_created'
     LIMIT 1),
    'unknown'
  )
WHERE so.id IN (
  SELECT DISTINCT so2.id 
  FROM public.shopflow_orders so2
  JOIN public.shopflow_logs sl ON sl.order_id = so2.id
  WHERE sl.event_type = 'job_created'
    AND sl.payload->>'woo_status' IN ('pending', 'failed', 'on-hold', 'pending-payment', 'cancelled')
);