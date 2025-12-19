-- Create AI status settings table (single-row table for global setting)
CREATE TABLE public.ai_status_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode text NOT NULL DEFAULT 'off' CHECK (mode IN ('live', 'manual', 'off')),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  organization_id uuid REFERENCES public.organizations(id)
);

-- Enable RLS
ALTER TABLE public.ai_status_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and update
CREATE POLICY "Authenticated users can view ai status"
  ON public.ai_status_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ai status"
  ON public.ai_status_settings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert ai status"
  ON public.ai_status_settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default row with OFF mode
INSERT INTO public.ai_status_settings (mode) VALUES ('off');