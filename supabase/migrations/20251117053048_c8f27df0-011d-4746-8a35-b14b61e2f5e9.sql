-- Create ShopFlow Orders table
CREATE TABLE public.shopflow_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL,
  approveflow_project_id uuid REFERENCES public.approveflow_projects(id),
  customer_name text NOT NULL,
  product_type text NOT NULL,
  status text NOT NULL DEFAULT 'design_requested',
  priority text DEFAULT 'normal',
  estimated_completion_date timestamp with time zone,
  assigned_to text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ShopFlow Logs table
CREATE TABLE public.shopflow_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.shopflow_orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopflow_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopflow_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopflow_orders
CREATE POLICY "Anyone can view orders"
ON public.shopflow_orders
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert orders"
ON public.shopflow_orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
ON public.shopflow_orders
FOR UPDATE
USING (true);

-- RLS Policies for shopflow_logs
CREATE POLICY "Anyone can view logs"
ON public.shopflow_logs
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert logs"
ON public.shopflow_logs
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_shopflow_orders_updated_at
BEFORE UPDATE ON public.shopflow_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_approveflow_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_shopflow_orders_status ON public.shopflow_orders(status);
CREATE INDEX idx_shopflow_orders_order_number ON public.shopflow_orders(order_number);
CREATE INDEX idx_shopflow_logs_order_id ON public.shopflow_logs(order_id);