-- Add organization membership for WPW
-- This is needed for RLS policies to work correctly

-- First, let's create a function to add the current user to the WPW organization
-- This will be called when an admin logs in and needs access

-- Insert a default admin membership for the WPW organization
-- The user_id will need to be set when an admin user is created/logged in
-- For now, we'll create a trigger that auto-adds users with admin role to WPW org

CREATE OR REPLACE FUNCTION public.auto_add_admin_to_wpw_org()
RETURNS TRIGGER AS $$
DECLARE
  wpw_org_id UUID := '51aa96db-c06d-41ae-b3cb-25b045c75caf';
BEGIN
  -- When a user gets admin role, add them to WPW organization
  IF NEW.role = 'admin' THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (wpw_org_id, NEW.user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS on_admin_role_assigned ON public.user_roles;
CREATE TRIGGER on_admin_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_admin_to_wpw_org();

-- Also add existing admins to the WPW organization
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT '51aa96db-c06d-41ae-b3cb-25b045c75caf', user_id, 'admin'
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT DO NOTHING;