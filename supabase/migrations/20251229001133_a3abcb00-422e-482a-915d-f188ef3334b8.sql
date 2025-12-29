-- Harden access controls for affiliate_founders
ALTER TABLE public.affiliate_founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_founders FORCE ROW LEVEL SECURITY;

-- Ensure privileges are not publicly granted
REVOKE ALL ON TABLE public.affiliate_founders FROM PUBLIC;
REVOKE ALL ON TABLE public.affiliate_founders FROM anon;
REVOKE ALL ON TABLE public.affiliate_founders FROM authenticated;

-- Allow authenticated users to access table but rely on RLS to filter rows
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.affiliate_founders TO authenticated;