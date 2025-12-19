-- Drop existing constraint
ALTER TABLE public.quotes DROP CONSTRAINT quotes_status_check;

-- Add new constraint with additional statuses for approval workflow
ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'sent'::text, 'approved'::text, 'completed'::text, 'expired'::text, 'lead'::text, 'follow_up'::text, 'rejected'::text]));