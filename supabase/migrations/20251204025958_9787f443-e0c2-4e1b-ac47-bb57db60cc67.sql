-- Create launch_signups table for "Notify Me" signups
CREATE TABLE public.launch_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'coming_soon'
);

-- Enable RLS
ALTER TABLE public.launch_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their email (public access for signups)
CREATE POLICY "Allow public signup" ON public.launch_signups
  FOR INSERT WITH CHECK (true);

-- Only admins can view signups
CREATE POLICY "Admins can view signups" ON public.launch_signups
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));