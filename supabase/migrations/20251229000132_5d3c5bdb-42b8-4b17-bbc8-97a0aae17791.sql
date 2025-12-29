-- Secure affiliate_founders table with RLS

-- Enable RLS
ALTER TABLE public.affiliate_founders ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_founders'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.affiliate_founders', pol.policyname);
  END LOOP;
END $$;

-- Only admins can view affiliate founders
CREATE POLICY "Admins can view affiliate founders"
ON public.affiliate_founders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert affiliate founders
CREATE POLICY "Admins can insert affiliate founders"
ON public.affiliate_founders
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update affiliate founders
CREATE POLICY "Admins can update affiliate founders"
ON public.affiliate_founders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete affiliate founders
CREATE POLICY "Admins can delete affiliate founders"
ON public.affiliate_founders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow founders to view their own record (for affiliate portal access)
CREATE POLICY "Founders can view own record"
ON public.affiliate_founders
FOR SELECT
TO authenticated
USING (email = auth.jwt()->>'email');

-- Allow founders to update their own profile fields
CREATE POLICY "Founders can update own profile"
ON public.affiliate_founders
FOR UPDATE
TO authenticated
USING (email = auth.jwt()->>'email')
WITH CHECK (email = auth.jwt()->>'email');