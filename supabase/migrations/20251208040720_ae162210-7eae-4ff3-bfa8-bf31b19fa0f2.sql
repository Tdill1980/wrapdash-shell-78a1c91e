-- Create email_unsubscribes table for compliance
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id),
  reason TEXT,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_sequence_enrollments table to track which quotes are enrolled in sequences
CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  emails_sent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_bounces table for bounce handling
CREATE TABLE IF NOT EXISTS public.email_bounces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL, -- 'hard', 'soft', 'complaint'
  reason TEXT,
  provider_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_unsubscribes
CREATE POLICY "Authenticated users can view unsubscribes"
  ON public.email_unsubscribes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert unsubscribes"
  ON public.email_unsubscribes FOR INSERT
  WITH CHECK (true);

-- RLS Policies for email_sequence_enrollments
CREATE POLICY "Authenticated users can view enrollments"
  ON public.email_sequence_enrollments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert enrollments"
  ON public.email_sequence_enrollments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update enrollments"
  ON public.email_sequence_enrollments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage enrollments"
  ON public.email_sequence_enrollments FOR ALL
  USING (true);

-- RLS Policies for email_bounces
CREATE POLICY "Authenticated users can view bounces"
  ON public.email_bounces FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert bounces"
  ON public.email_bounces FOR INSERT
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON public.email_unsubscribes(email);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_quote ON public.email_sequence_enrollments(quote_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_active ON public.email_sequence_enrollments(is_active, last_email_sent_at);
CREATE INDEX IF NOT EXISTS idx_email_bounces_email ON public.email_bounces(email);

-- Enable realtime for enrollments
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_sequence_enrollments;