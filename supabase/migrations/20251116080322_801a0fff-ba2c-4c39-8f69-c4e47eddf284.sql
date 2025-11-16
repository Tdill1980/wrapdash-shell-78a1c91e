-- Create wrapbox_kits table
CREATE TABLE public.wrapbox_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_vault_id UUID REFERENCES public.color_visualizations(id) ON DELETE SET NULL,
  organization_id UUID,
  vehicle_json JSONB NOT NULL,
  panels JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Ready', 'Exported')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wrapbox_kits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view wrapbox kits"
  ON public.wrapbox_kits
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert wrapbox kits"
  ON public.wrapbox_kits
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update wrapbox kits"
  ON public.wrapbox_kits
  FOR UPDATE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_wrapbox_kits_updated_at
  BEFORE UPDATE ON public.wrapbox_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_color_visualizations_updated_at();