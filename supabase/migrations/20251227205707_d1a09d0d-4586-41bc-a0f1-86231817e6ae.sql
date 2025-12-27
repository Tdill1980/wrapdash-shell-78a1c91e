-- Create saved_views table for virtual folders
CREATE TABLE public.saved_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  target_file_type TEXT NOT NULL DEFAULT 'any',
  filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view saved views in their organization"
  ON public.saved_views
  FOR SELECT
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert saved views in their organization"
  ON public.saved_views
  FOR INSERT
  WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update saved views in their organization"
  ON public.saved_views
  FOR UPDATE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete non-system saved views in their organization"
  ON public.saved_views
  FOR DELETE
  USING (
    ((organization_id = get_user_organization_id()) OR (organization_id IS NULL))
    AND is_system = false
  );

-- Trigger for updated_at
CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();