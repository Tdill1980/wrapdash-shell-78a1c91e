-- ============================================================
-- WRAPCOMMANDAI ECOSYSTEM WIRING MIGRATION
-- SIMPLIFIED: Just use contacts, skip duplicates for now
-- ============================================================

-- Skip deduplication - unique index will be partial, we'll clean later
-- The triggers will handle conflicts gracefully by looking up first

-- ============================================================
-- PHASE 1: SCHEMA ADDITIONS
-- ============================================================

-- 1.1 Add escalation columns to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false;

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- 1.2 Add contact_id FK to quotes
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id);

-- 1.3 Add scheduled_for column to ai_actions
ALTER TABLE public.ai_actions 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- ============================================================
-- PHASE 2: CONTACT SYNC TRIGGERS (using lookup pattern instead of upsert)
-- ============================================================

-- 2.1 Trigger: Conversation → Contact Sync
CREATE OR REPLACE FUNCTION public.sync_conversation_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_id UUID;
  v_email TEXT;
  v_name TEXT;
  v_phone TEXT;
BEGIN
  v_email := NEW.chat_state->>'customer_email';
  v_name := NEW.chat_state->>'customer_name';
  v_phone := NEW.chat_state->>'customer_phone';
  
  IF v_email IS NOT NULL AND v_email != '' THEN
    -- Try to find existing contact first
    SELECT id INTO v_contact_id FROM public.contacts
    WHERE organization_id = NEW.organization_id 
    AND LOWER(email) = LOWER(v_email)
    LIMIT 1;
    
    IF v_contact_id IS NULL THEN
      -- Insert new contact
      INSERT INTO public.contacts (organization_id, name, email, phone, source, metadata)
      VALUES (
        NEW.organization_id,
        COALESCE(v_name, 'Website Visitor'),
        LOWER(v_email),
        v_phone,
        CASE NEW.channel
          WHEN 'website' THEN 'chat'
          WHEN 'website_chat' THEN 'chat'
          ELSE COALESCE(NEW.channel, 'chat')
        END,
        jsonb_build_object('first_conversation_id', NEW.id)
      )
      RETURNING id INTO v_contact_id;
    ELSE
      -- Update existing
      UPDATE public.contacts
      SET name = COALESCE(NULLIF(v_name, 'Website Visitor'), name),
          phone = COALESCE(v_phone, phone),
          updated_at = NOW()
      WHERE id = v_contact_id;
    END IF;
    
    IF v_contact_id IS NOT NULL AND NEW.contact_id IS NULL THEN
      NEW.contact_id := v_contact_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Contact sync failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_conversation_sync_contact ON public.conversations;
CREATE TRIGGER trg_conversation_sync_contact
BEFORE INSERT OR UPDATE OF chat_state ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.sync_conversation_to_contact();

-- 2.2 Trigger: Phone Call → Contact Sync
CREATE OR REPLACE FUNCTION public.sync_phone_call_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  IF NEW.caller_phone IS NOT NULL AND NEW.caller_phone != '' THEN
    -- Try to find existing contact by phone
    SELECT id INTO v_contact_id FROM public.contacts
    WHERE organization_id = NEW.organization_id 
    AND phone = NEW.caller_phone
    LIMIT 1;
    
    IF v_contact_id IS NULL THEN
      INSERT INTO public.contacts (organization_id, name, phone, source, metadata, tags)
      VALUES (
        NEW.organization_id,
        COALESCE(NEW.customer_name, 'Phone Caller'),
        NEW.caller_phone,
        'phone',
        jsonb_build_object(
          'first_call_id', NEW.id,
          'is_hot_lead', NEW.is_hot_lead,
          'vehicle', NEW.vehicle_info
        ),
        CASE WHEN NEW.is_hot_lead THEN ARRAY['hot_lead'] ELSE ARRAY[]::text[] END
      )
      RETURNING id INTO v_contact_id;
    ELSE
      UPDATE public.contacts
      SET name = COALESCE(NULLIF(NEW.customer_name, 'Phone Caller'), name),
          updated_at = NOW(),
          tags = CASE 
            WHEN NEW.is_hot_lead AND NOT (COALESCE(tags, ARRAY[]::text[]) @> ARRAY['hot_lead']) 
            THEN array_append(COALESCE(tags, ARRAY[]::text[]), 'hot_lead')
            ELSE tags
          END
      WHERE id = v_contact_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Phone contact sync failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_phone_call_sync_contact ON public.phone_calls;
CREATE TRIGGER trg_phone_call_sync_contact
AFTER INSERT OR UPDATE OF customer_name, caller_phone ON public.phone_calls
FOR EACH ROW
EXECUTE FUNCTION public.sync_phone_call_to_contact();

-- 2.3 Trigger: Quote → Contact Sync
CREATE OR REPLACE FUNCTION public.sync_quote_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
    -- Try to find existing contact first
    SELECT id INTO v_contact_id FROM public.contacts
    WHERE organization_id = NEW.organization_id 
    AND LOWER(email) = LOWER(NEW.customer_email)
    LIMIT 1;
    
    IF v_contact_id IS NULL THEN
      INSERT INTO public.contacts (organization_id, name, email, phone, source, metadata)
      VALUES (
        NEW.organization_id,
        NEW.customer_name,
        LOWER(NEW.customer_email),
        NEW.customer_phone,
        COALESCE(NEW.source, 'quote'),
        jsonb_build_object('first_quote_id', NEW.id)
      )
      RETURNING id INTO v_contact_id;
    ELSE
      UPDATE public.contacts
      SET name = COALESCE(NEW.customer_name, name),
          phone = COALESCE(NEW.customer_phone, phone),
          updated_at = NOW()
      WHERE id = v_contact_id;
    END IF;
    
    NEW.contact_id := v_contact_id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_quote_sync_contact ON public.quotes;
CREATE TRIGGER trg_quote_sync_contact
BEFORE INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_quote_to_contact();

-- ============================================================
-- PHASE 3: ALERT TRIGGERS
-- ============================================================

-- 3.1 Trigger: Escalation SMS Alert
CREATE OR REPLACE FUNCTION public.send_escalation_sms_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.escalated = true AND (OLD.escalated IS NULL OR OLD.escalated = false) THEN
    INSERT INTO public.ai_actions (
      action_type,
      status,
      organization_id,
      conversation_id,
      action_payload
    ) VALUES (
      'send_sms_alert',
      'pending',
      NEW.organization_id,
      NEW.id,
      jsonb_build_object(
        'phone', '+14807726003',
        'message', '🚨 Escalation: ' || COALESCE(NEW.chat_state->>'customer_name', 'Customer') || ' needs callback. Check Escalation Desk.',
        'reason', NEW.escalation_reason
      )
    );
    
    NEW.escalated_at := NOW();
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Escalation SMS alert failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_escalation_sms_alert ON public.conversations;
CREATE TRIGGER trg_escalation_sms_alert
BEFORE UPDATE OF escalated ON public.conversations
FOR EACH ROW
WHEN (NEW.escalated = true AND (OLD.escalated IS DISTINCT FROM true))
EXECUTE FUNCTION public.send_escalation_sms_alert();

-- 3.2 Trigger: Hot Lead Auto-Escalation
CREATE OR REPLACE FUNCTION public.escalate_hot_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_price > 1000 
     OR COALESCE(NEW.customer_name, '') ILIKE '%fleet%' 
     OR COALESCE(NEW.source_message, '') ILIKE '%urgent%' THEN
    
    IF NEW.source_conversation_id IS NOT NULL THEN
      UPDATE public.conversations
      SET escalated = true,
          escalation_reason = 'High value lead: $' || COALESCE(NEW.total_price::text, '0')
      WHERE id = NEW.source_conversation_id
      AND (escalated IS NULL OR escalated = false);
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_hot_lead_escalation ON public.quotes;
CREATE TRIGGER trg_hot_lead_escalation
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.escalate_hot_lead();

-- ============================================================
-- PHASE 4: OPERATIONS TRIGGERS
-- ============================================================

-- 4.1 Trigger: Portfolio → ContentBox Sync
CREATE OR REPLACE FUNCTION public.sync_portfolio_to_contentbox()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.ai_actions (
      action_type,
      status,
      organization_id,
      action_payload
    ) VALUES (
      'portfolio_to_contentbox',
      'pending',
      NEW.organization_id,
      jsonb_build_object(
        'portfolio_job_id', NEW.id,
        'vehicle_make', NEW.vehicle_make,
        'vehicle_model', NEW.vehicle_model,
        'vehicle_year', NEW.vehicle_year,
        'finish', NEW.finish,
        'tags', ARRAY['completed', COALESCE(NEW.vehicle_make, 'wrap'), COALESCE(NEW.finish, 'custom')]
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Portfolio to ContentBox sync failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_portfolio_to_contentbox ON public.portfolio_jobs;
CREATE TRIGGER trg_portfolio_to_contentbox
AFTER UPDATE OF status ON public.portfolio_jobs
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.sync_portfolio_to_contentbox();

-- 4.2 Trigger: Job Completed → Queue Review Request
CREATE OR REPLACE FUNCTION public.queue_review_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.ai_actions (
      action_type,
      status,
      scheduled_for,
      organization_id,
      action_payload
    ) VALUES (
      'send_review_request',
      'scheduled',
      NOW() + INTERVAL '3 days',
      NEW.organization_id,
      jsonb_build_object(
        'portfolio_job_id', NEW.id,
        'customer_name', NEW.customer_name,
        'vehicle', COALESCE(NEW.vehicle_year::text, '') || ' ' || COALESCE(NEW.vehicle_make, '') || ' ' || COALESCE(NEW.vehicle_model, '')
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_queue_review_request ON public.portfolio_jobs;
CREATE TRIGGER trg_queue_review_request
AFTER UPDATE OF status ON public.portfolio_jobs
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.queue_review_request();