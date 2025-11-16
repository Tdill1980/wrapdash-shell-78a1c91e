-- Fix search_path security warning - drop trigger first
DROP TRIGGER IF EXISTS update_color_visualizations_updated_at ON public.color_visualizations;
DROP FUNCTION IF EXISTS public.update_color_visualizations_updated_at();

-- Recreate function with proper security settings
CREATE OR REPLACE FUNCTION public.update_color_visualizations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_color_visualizations_updated_at
BEFORE UPDATE ON public.color_visualizations
FOR EACH ROW
EXECUTE FUNCTION public.update_color_visualizations_updated_at();