-- ============================================
-- MIGHTYMAIL ECOSYSTEM WIRING
-- Phase 1: Add email marketing columns to contacts
-- Phase 2: Add contact_id to enrollments + triggers
-- Phase 3: Seed default sequences
-- ============================================

-- Phase 1.1: Add email marketing columns to contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sends_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_opens_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_quote_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_quote_amount NUMERIC;

-- Phase 1.2: Add contact_id FK to email_sequence_enrollments
ALTER TABLE public.email_sequence_enrollments
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id);

-- Create index for contact lookups on enrollments
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_contact 
ON public.email_sequence_enrollments(contact_id);

-- Phase 2.1: Auto-enroll contacts in sequences based on source
CREATE OR REPLACE FUNCTION public.auto_enroll_contact_in_sequence()
RETURNS TRIGGER AS $$
DECLARE
  v_sequence_id UUID;
  v_sequence_name TEXT;
BEGIN
  -- Only enroll contacts with valid emails
  IF NEW.email IS NULL OR NEW.email = '' OR NEW.email LIKE '%@capture.local%' THEN
    RETURN NEW;
  END IF;
  
  -- Skip if already unsubscribed
  IF NEW.email_unsubscribed = true THEN
    RETURN NEW;
  END IF;
  
  -- Find appropriate sequence based on source
  v_sequence_name := CASE NEW.source
    WHEN 'chat' THEN 'Website Lead Nurture'
    WHEN 'quote' THEN 'Quote Follow-up'
    WHEN 'phone' THEN 'Phone Lead Nurture'
    ELSE 'New Lead Welcome'
  END;
  
  SELECT id INTO v_sequence_id
  FROM public.email_sequences
  WHERE name ILIKE '%' || v_sequence_name || '%'
    AND is_active = true
    AND (organization_id = NEW.organization_id OR organization_id IS NULL)
  LIMIT 1;
  
  -- If no specific sequence, try default
  IF v_sequence_id IS NULL THEN
    SELECT id INTO v_sequence_id
    FROM public.email_sequences
    WHERE is_active = true
      AND (organization_id = NEW.organization_id OR organization_id IS NULL)
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  -- Create enrollment if sequence found
  IF v_sequence_id IS NOT NULL THEN
    INSERT INTO public.email_sequence_enrollments (
      contact_id,
      sequence_id,
      customer_email,
      customer_name,
      enrolled_at,
      emails_sent,
      is_active
    ) VALUES (
      NEW.id,
      v_sequence_id,
      NEW.email,
      NEW.name,
      NOW(),
      0,
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Email sequence enrollment failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-enrollment
DROP TRIGGER IF EXISTS trg_contact_auto_enroll_sequence ON public.contacts;
CREATE TRIGGER trg_contact_auto_enroll_sequence
AFTER INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.auto_enroll_contact_in_sequence();

-- Phase 2.2: Wire quotes to email retargeting
CREATE OR REPLACE FUNCTION public.wire_quote_to_email()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_id UUID;
  v_sequence_id UUID;
BEGIN
  -- Skip if no valid email
  IF NEW.customer_email IS NULL OR NEW.customer_email = '' 
     OR NEW.customer_email LIKE '%@capture.local%' THEN
    RETURN NEW;
  END IF;
  
  -- Get contact (should exist via trg_quote_sync_contact)
  SELECT id INTO v_contact_id
  FROM public.contacts
  WHERE LOWER(email) = LOWER(NEW.customer_email)
    AND organization_id = NEW.organization_id
  LIMIT 1;
  
  -- Update contact with quote info
  IF v_contact_id IS NOT NULL THEN
    UPDATE public.contacts SET
      last_quote_at = NOW(),
      last_quote_amount = NEW.total_price,
      tags = CASE 
        WHEN NOT (COALESCE(tags, ARRAY[]::text[]) @> ARRAY['quoted']) 
        THEN array_append(COALESCE(tags, ARRAY[]::text[]), 'quoted')
        ELSE tags
      END
    WHERE id = v_contact_id;
  END IF;
  
  -- Find quote follow-up sequence
  SELECT id INTO v_sequence_id
  FROM public.email_sequences
  WHERE name ILIKE '%quote%follow%'
    AND is_active = true
  LIMIT 1;
  
  -- Enroll in quote sequence if not already
  IF v_sequence_id IS NOT NULL AND v_contact_id IS NOT NULL THEN
    INSERT INTO public.email_sequence_enrollments (
      contact_id,
      quote_id,
      sequence_id,
      customer_email,
      customer_name,
      enrolled_at,
      emails_sent,
      is_active
    ) VALUES (
      v_contact_id,
      NEW.id,
      v_sequence_id,
      NEW.customer_email,
      NEW.customer_name,
      NOW(),
      0,
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Quote email wiring failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for quote email wiring
DROP TRIGGER IF EXISTS trg_quote_wire_to_email ON public.quotes;
CREATE TRIGGER trg_quote_wire_to_email
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.wire_quote_to_email();

-- Phase 3: Seed default email sequences (if they don't exist)
INSERT INTO public.email_sequences (name, description, is_active, send_delay_days)
SELECT 'Website Lead Nurture', 'Follow-up sequence for website chat leads', true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_sequences WHERE name ILIKE '%website%lead%nurture%'
);

INSERT INTO public.email_sequences (name, description, is_active, send_delay_days)
SELECT 'Quote Follow-up', 'Automated follow-up for quote requests', true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_sequences WHERE name ILIKE '%quote%follow%'
);

INSERT INTO public.email_sequences (name, description, is_active, send_delay_days)
SELECT 'Phone Lead Nurture', 'Follow-up for leads from phone calls', true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_sequences WHERE name ILIKE '%phone%lead%'
);