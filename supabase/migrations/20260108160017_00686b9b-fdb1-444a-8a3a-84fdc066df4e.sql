-- Create jordan_directives table for storing admin directives
CREATE TABLE public.jordan_directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directive TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  scope TEXT DEFAULT 'website_chat', -- 'website_chat', 'admin_chat', or 'all'
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jordan_directives ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read directives
CREATE POLICY "Authenticated users can read directives"
  ON public.jordan_directives FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to manage directives
CREATE POLICY "Authenticated users can manage directives"
  ON public.jordan_directives FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Add index for active directives lookup
CREATE INDEX idx_jordan_directives_active ON public.jordan_directives(active) WHERE active = true;