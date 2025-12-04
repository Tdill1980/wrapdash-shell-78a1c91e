-- Create portfolio_jobs table (linked to ShopFlow)
CREATE TABLE public.portfolio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  
  -- ShopFlow Integration (Single Source of Truth)
  shopflow_order_id UUID REFERENCES public.shopflow_orders(id),
  order_number TEXT,
  
  -- Job Details
  title TEXT NOT NULL,
  customer_name TEXT,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  finish TEXT,
  job_price NUMERIC DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- QR Code Upload Token
  upload_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create portfolio_media table
CREATE TABLE public.portfolio_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.portfolio_jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_type TEXT DEFAULT 'image',
  media_type TEXT DEFAULT 'after', -- 'before' | 'after' | 'process'
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_jobs
CREATE POLICY "Users can view jobs in their organization"
  ON public.portfolio_jobs FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert jobs"
  ON public.portfolio_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own jobs"
  ON public.portfolio_jobs FOR UPDATE
  USING (organization_id = get_user_organization_id() OR user_id = auth.uid());

CREATE POLICY "Users can delete their own jobs"
  ON public.portfolio_jobs FOR DELETE
  USING (organization_id = get_user_organization_id() OR user_id = auth.uid());

-- Public access for QR upload (by token)
CREATE POLICY "Anyone can view job by upload token"
  ON public.portfolio_jobs FOR SELECT
  USING (upload_token IS NOT NULL);

-- RLS Policies for portfolio_media
CREATE POLICY "Users can view media for accessible jobs"
  ON public.portfolio_media FOR SELECT
  USING (job_id IN (SELECT id FROM public.portfolio_jobs));

CREATE POLICY "Anyone can insert media"
  ON public.portfolio_media FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update media"
  ON public.portfolio_media FOR UPDATE
  USING (job_id IN (SELECT id FROM public.portfolio_jobs WHERE organization_id = get_user_organization_id() OR user_id = auth.uid()));

CREATE POLICY "Users can delete media"
  ON public.portfolio_media FOR DELETE
  USING (job_id IN (SELECT id FROM public.portfolio_jobs WHERE organization_id = get_user_organization_id() OR user_id = auth.uid()));

-- Create storage bucket for portfolio media
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-media', 'portfolio-media', true);

-- Storage policies
CREATE POLICY "Anyone can view portfolio media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-media');

CREATE POLICY "Anyone can upload portfolio media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio-media');

CREATE POLICY "Users can update their portfolio media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio-media');

CREATE POLICY "Users can delete their portfolio media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio-media');

-- Auto-create portfolio job when ShopFlow order completes
CREATE OR REPLACE FUNCTION public.auto_create_portfolio_job()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.portfolio_jobs (
      organization_id,
      shopflow_order_id,
      order_number,
      title,
      customer_name,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      status
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      NEW.order_number,
      COALESCE(NEW.product_type, 'Wrap Job #' || NEW.order_number),
      NEW.customer_name,
      (NEW.vehicle_info->>'year')::INTEGER,
      NEW.vehicle_info->>'make',
      NEW.vehicle_info->>'model',
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS on_shopflow_order_completed ON public.shopflow_orders;
CREATE TRIGGER on_shopflow_order_completed
  AFTER UPDATE ON public.shopflow_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_portfolio_job();

-- Updated at trigger
CREATE TRIGGER update_portfolio_jobs_updated_at
  BEFORE UPDATE ON public.portfolio_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_media;