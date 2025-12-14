-- Drop the old trigger that only fired on 'completed'
DROP TRIGGER IF EXISTS auto_create_portfolio_job_trigger ON public.shopflow_orders;

-- Update the function to create portfolio job when order starts processing (not just completed)
CREATE OR REPLACE FUNCTION public.auto_create_portfolio_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create portfolio job when order moves to 'processing' status (work is starting)
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status != 'processing') THEN
    INSERT INTO public.portfolio_jobs (
      organization_id,
      shopflow_order_id,
      order_number,
      title,
      customer_name,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      status
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      NEW.order_number,
      COALESCE(NEW.product_type, 'Wrap Job #' || NEW.order_number),
      NEW.customer_name,
      (NEW.vehicle_info->>'year')::INTEGER,
      NEW.vehicle_info->>'make',
      NEW.vehicle_info->>'model',
      'pending' -- Pending means needs before photos
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER auto_create_portfolio_job_trigger
  AFTER UPDATE ON public.shopflow_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_portfolio_job();