-- Update the sync_conversation_to_contact function to create contacts for ALL chats
-- including anonymous visitors without email addresses

CREATE OR REPLACE FUNCTION public.sync_conversation_to_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact_id UUID;
  v_email TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_session_id TEXT;
BEGIN
  v_email := NEW.chat_state->>'customer_email';
  v_name := NEW.chat_state->>'customer_name';
  v_phone := NEW.chat_state->>'customer_phone';
  v_session_id := NEW.metadata->>'session_id';
  
  -- Always create/update contact, even without email
  IF v_email IS NOT NULL AND v_email != '' THEN
    -- Has email: find by email first
    SELECT id INTO v_contact_id FROM public.contacts
    WHERE organization_id = NEW.organization_id 
    AND LOWER(email) = LOWER(v_email)
    LIMIT 1;
  ELSIF v_session_id IS NOT NULL AND v_session_id != '' THEN
    -- No email but has session_id: find by session_id in metadata
    SELECT id INTO v_contact_id FROM public.contacts
    WHERE organization_id = NEW.organization_id 
    AND metadata->>'session_id' = v_session_id
    LIMIT 1;
  END IF;
  
  IF v_contact_id IS NULL THEN
    -- Create new contact (anonymous if no email)
    INSERT INTO public.contacts (
      organization_id, 
      name, 
      email, 
      phone, 
      source, 
      metadata, 
      tags
    ) VALUES (
      NEW.organization_id,
      COALESCE(NULLIF(v_name, ''), 'Website Visitor'),
      CASE WHEN v_email IS NOT NULL AND v_email != '' THEN LOWER(v_email) ELSE NULL END,
      v_phone,
      CASE NEW.channel
        WHEN 'website' THEN 'chat'
        WHEN 'website_chat' THEN 'chat'
        ELSE COALESCE(NEW.channel, 'chat')
      END,
      jsonb_build_object(
        'session_id', v_session_id,
        'first_conversation_id', NEW.id,
        'vehicle', NEW.chat_state->'vehicle',
        'geo', NEW.metadata->'geo',
        'page_url', NEW.metadata->>'page_url'
      ),
      CASE WHEN v_email IS NULL OR v_email = '' 
           THEN ARRAY['anonymous_lead'] 
           ELSE ARRAY[]::text[] END
    ) RETURNING id INTO v_contact_id;
  ELSE
    -- Update existing contact with latest data
    UPDATE public.contacts SET
      name = COALESCE(NULLIF(v_name, ''), NULLIF(name, 'Website Visitor'), name),
      phone = COALESCE(NULLIF(v_phone, ''), phone),
      email = COALESCE(
        CASE WHEN v_email IS NOT NULL AND v_email != '' THEN LOWER(v_email) ELSE NULL END, 
        email
      ),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'last_conversation_id', NEW.id,
        'vehicle', COALESCE(NEW.chat_state->'vehicle', metadata->'vehicle'),
        'geo', COALESCE(NEW.metadata->'geo', metadata->'geo'),
        'last_page_url', NEW.metadata->>'page_url'
      ),
      tags = CASE 
        WHEN v_email IS NOT NULL AND v_email != '' 
        THEN array_remove(COALESCE(tags, ARRAY[]::text[]), 'anonymous_lead')
        ELSE tags
      END,
      updated_at = NOW()
    WHERE id = v_contact_id;
  END IF;
  
  -- Link contact to conversation
  IF v_contact_id IS NOT NULL AND NEW.contact_id IS NULL THEN
    NEW.contact_id := v_contact_id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Contact sync failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists (recreate to ensure it fires)
DROP TRIGGER IF EXISTS trg_conversation_sync_contact ON public.conversations;

CREATE TRIGGER trg_conversation_sync_contact
  BEFORE INSERT OR UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_conversation_to_contact();