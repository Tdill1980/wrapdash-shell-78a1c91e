-- Create email_flows table for MightyMail AI
CREATE TABLE public.email_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL DEFAULT 'manual',
  flow_type TEXT NOT NULL DEFAULT 'nurture',
  brand TEXT DEFAULT 'wpw',
  is_active BOOLEAN DEFAULT false,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_flow_steps table
CREATE TABLE public.email_flow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.email_flows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL DEFAULT 1,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  preview_text TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_flow_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_flows
CREATE POLICY "Authenticated users can view flows"
ON public.email_flows FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create flows"
ON public.email_flows FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update flows"
ON public.email_flows FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete flows"
ON public.email_flows FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for email_flow_steps
CREATE POLICY "Authenticated users can view steps"
ON public.email_flow_steps FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create steps"
ON public.email_flow_steps FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update steps"
ON public.email_flow_steps FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete steps"
ON public.email_flow_steps FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_email_flows_updated_at
BEFORE UPDATE ON public.email_flows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_flow_steps_updated_at
BEFORE UPDATE ON public.email_flow_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_email_flow_steps_flow_id ON public.email_flow_steps(flow_id);
CREATE INDEX idx_email_flows_trigger ON public.email_flows(trigger);
CREATE INDEX idx_email_flows_is_active ON public.email_flows(is_active);