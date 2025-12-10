-- Create inspo_analyses table for storing video style analysis
CREATE TABLE public.inspo_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  source_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  thumbnail_url TEXT,
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_saved BOOLEAN DEFAULT false,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspo_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's inspo analyses"
ON public.inspo_analyses FOR SELECT
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert inspo analyses"
ON public.inspo_analyses FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can update their org's inspo analyses"
ON public.inspo_analyses FOR UPDATE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete their org's inspo analyses"
ON public.inspo_analyses FOR DELETE
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_inspo_analyses_updated_at
BEFORE UPDATE ON public.inspo_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();