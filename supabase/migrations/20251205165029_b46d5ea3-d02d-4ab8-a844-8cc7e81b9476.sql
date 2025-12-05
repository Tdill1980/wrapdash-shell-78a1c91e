
-- Create email_templates table for storing Unlayer designs
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  design_json JSONB NOT NULL DEFAULT '{}',
  html TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for org-scoped access
CREATE POLICY "Users can view templates in their organization"
ON public.email_templates FOR SELECT
USING (
  organization_id IS NULL OR
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create templates in their organization"
ON public.email_templates FOR INSERT
WITH CHECK (
  organization_id IS NULL OR
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update templates in their organization"
ON public.email_templates FOR UPDATE
USING (
  organization_id IS NULL OR
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete templates in their organization"
ON public.email_templates FOR DELETE
USING (
  organization_id IS NULL OR
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
