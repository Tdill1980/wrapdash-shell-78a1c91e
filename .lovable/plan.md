
# MightyMail Complete Ecosystem Wiring Plan

## Executive Summary

MightyMail is built but operates in SILOS. This plan wires MightyMail to the complete WrapCommandAI nervous system: MightyCustomer (contacts), Quote Tool, website chat, phone calls, and text messages for unified email retargeting.

---

## Current State Analysis

### MightyMail Components Built

| Component | Location | Status |
|-----------|----------|--------|
| MightyMail Dashboard | `/email-campaigns` | Hardcoded campaigns |
| MightyMail Admin | `/admin/mightymail` | Tabs for sequences, branding, CSV upload |
| MightyMail Quotes | `/admin/mightymail/quotes` | Retargeting interface |
| MightyMail Winback | `/mightymail/winback` | Klaviyo AI winback |
| MightyMail Campaign Sender | `/mightymail/campaign-sender` | Manual campaigns |

### Edge Functions Built

| Function | Purpose |
|----------|---------|
| `send-mightymail-quote` | Sends quote emails via Resend |
| `send-mightymail-test` | Test email sending |
| `send-mightymail-campaign` | Campaign emails via Resend |
| `run-quote-followups` | Automated retargeting (1hr, 4hr, 24hr) |
| `create-klaviyo-campaign` | Klaviyo campaign creation |
| `ai-generate-winback-email` | AI-generated winback content |

### Database Tables

| Table | Records | Purpose |
|-------|---------|---------|
| `email_sequences` | Active | Sequence definitions |
| `email_sequence_enrollments` | Active | Contact enrollments |
| `email_retarget_customers` | Active | Legacy retarget list |
| `email_tracking` | Active | Email send/open/click logs |
| `quote_retargeting_log` | Active | Quote follow-up history |
| `klaviyo_campaigns` | Active | Klaviyo campaign records |

### What's MISSING (The Gaps)

| Gap | Impact |
|-----|--------|
| No link between `contacts` and `email_sequences` | New contacts not auto-enrolled |
| `email_retarget_customers` duplicates `contacts` | Two separate customer lists |
| No trigger on quote creation for enrollment | Quotes don't auto-start sequences |
| No trigger on chat/phone for email capture | Lead data not flowing to email |
| No SMS-to-email retargeting | Text leads not getting email follow-up |

---

## Phase 1: Unify Customer Data (contacts as Single Source of Truth)

### 1.1 Deprecate `email_retarget_customers` in Favor of `contacts`

The `contacts` table already has:
- `id`, `organization_id`, `name`, `email`, `phone`
- `source`, `tags`, `metadata`, `created_at`

Add missing columns to `contacts`:

```sql
-- Add email marketing columns to contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sends_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_opens_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_quote_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_quote_amount NUMERIC;
```

### 1.2 Create contact_id FK on email_sequence_enrollments

```sql
-- Link enrollments to contacts (not just email strings)
ALTER TABLE public.email_sequence_enrollments
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_contact 
ON public.email_sequence_enrollments(contact_id);
```

---

## Phase 2: Auto-Enroll Contacts in Email Sequences

### 2.1 Trigger: New Contact Enrolls in Default Sequence

When a contact is created, auto-enroll them based on source.

```sql
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
  
  -- Check for unsubscribe
  IF EXISTS (SELECT 1 FROM public.email_unsubscribes WHERE email = NEW.email) THEN
    NEW.email_unsubscribed := true;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_contact_auto_enroll_sequence
AFTER INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.auto_enroll_contact_in_sequence();
```

---

## Phase 3: Wire Quote Creation to Email Retargeting

### 3.1 Trigger: Quote Creates/Updates Contact and Enrollment

When a quote is created, ensure contact exists and is enrolled in quote follow-up sequence.

```sql
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
  
  -- Get or create contact (via existing trigger)
  SELECT id INTO v_contact_id
  FROM public.contacts
  WHERE email = LOWER(NEW.customer_email)
    AND organization_id = NEW.organization_id;
  
  -- Update contact with quote info
  IF v_contact_id IS NOT NULL THEN
    UPDATE public.contacts SET
      last_quote_at = NOW(),
      last_quote_amount = NEW.total_price,
      tags = CASE 
        WHEN NOT (tags @> ARRAY['quoted']) THEN array_append(tags, 'quoted')
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_quote_wire_to_email
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.wire_quote_to_email();
```

---

## Phase 4: Wire Website Chat to Email System

### 4.1 Update create-quote-from-chat Edge Function

After creating a quote, also ensure contact is enrolled in email sequence.

Add to `supabase/functions/create-quote-from-chat/index.ts` (after quote insert, around line 400):

```typescript
// Wire to MightyMail - enroll contact in sequence
if (customerEmail && !customerEmail.includes('@capture.local')) {
  // Find quote follow-up sequence
  const { data: sequence } = await supabase
    .from('email_sequence_enrollments')
    .select('id')
    .eq('customer_email', customerEmail)
    .eq('is_active', true)
    .maybeSingle();
  
  if (!sequence) {
    // Get default sequence
    const { data: defaultSequence } = await supabase
      .from('email_sequences')
      .select('id')
      .ilike('name', '%quote%follow%')
      .eq('is_active', true)
      .maybeSingle();
    
    if (defaultSequence) {
      await supabase.from('email_sequence_enrollments').insert({
        contact_id: contactId, // From contact upsert
        quote_id: quoteId,
        sequence_id: defaultSequence.id,
        customer_email: customerEmail,
        customer_name: customerName,
        enrolled_at: new Date().toISOString(),
        emails_sent: 0,
        is_active: true
      });
      
      console.log(`[MightyMail] Enrolled ${customerEmail} in quote follow-up sequence`);
    }
  }
}
```

---

## Phase 5: Wire Phone Calls to Email System

### 5.1 Update process-phone-speech Edge Function

When a phone call captures email, enroll in phone lead sequence.

Add to `supabase/functions/process-phone-speech/index.ts`:

```typescript
// Wire to MightyMail - if email captured, enroll in sequence
if (extractedEmail && !extractedEmail.includes('@capture.local')) {
  // Find phone lead sequence
  const { data: phoneSequence } = await supabase
    .from('email_sequences')
    .select('id')
    .or('name.ilike.%phone%,name.ilike.%call%')
    .eq('is_active', true)
    .maybeSingle();
  
  if (phoneSequence) {
    await supabase.from('email_sequence_enrollments').insert({
      contact_id: contactId,
      sequence_id: phoneSequence.id,
      customer_email: extractedEmail,
      customer_name: extractedName || 'Phone Caller',
      enrolled_at: new Date().toISOString(),
      emails_sent: 0,
      is_active: true
    }).onConflict('customer_email,sequence_id').ignore();
    
    console.log(`[MightyMail] Enrolled phone lead ${extractedEmail} in sequence`);
  }
}
```

---

## Phase 6: Create MightyMail Sequence Processor

### 6.1 New Edge Function: process-email-sequences

This function runs on a schedule (CRON) to send emails to enrolled contacts.

**File**: `supabase/functions/process-email-sequences/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  // Get active enrollments due for email
  const { data: enrollments } = await supabase
    .from('email_sequence_enrollments')
    .select(`
      *,
      sequence:email_sequences(*),
      contact:contacts(*)
    `)
    .eq('is_active', true)
    .is('unsubscribed_at', null)
    .is('completed_at', null);
  
  let sent = 0;
  for (const enrollment of enrollments || []) {
    const sequence = enrollment.sequence;
    if (!sequence?.emails || !Array.isArray(sequence.emails)) continue;
    
    // Check if next email is due
    const lastSent = enrollment.last_email_sent_at 
      ? new Date(enrollment.last_email_sent_at) 
      : new Date(enrollment.enrolled_at);
    const delayDays = sequence.send_delay_days || 1;
    const nextSendAt = new Date(lastSent.getTime() + delayDays * 24 * 60 * 60 * 1000);
    
    if (new Date() < nextSendAt) continue;
    
    // Get next email in sequence
    const nextEmailIndex = enrollment.emails_sent || 0;
    if (nextEmailIndex >= sequence.emails.length) {
      // Sequence complete
      await supabase
        .from('email_sequence_enrollments')
        .update({ completed_at: new Date().toISOString(), is_active: false })
        .eq('id', enrollment.id);
      continue;
    }
    
    const emailTemplate = sequence.emails[nextEmailIndex];
    
    // Send email
    try {
      await resend.emails.send({
        from: 'WePrintWraps <hello@weprintwraps.com>',
        to: [enrollment.customer_email],
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      // Update enrollment
      await supabase
        .from('email_sequence_enrollments')
        .update({
          emails_sent: nextEmailIndex + 1,
          last_email_sent_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);
      
      // Update contact metrics
      await supabase
        .from('contacts')
        .update({
          last_email_sent_at: new Date().toISOString(),
          email_sends_count: supabase.sql`email_sends_count + 1`
        })
        .eq('id', enrollment.contact_id);
      
      sent++;
    } catch (error) {
      console.error(`Failed to send to ${enrollment.customer_email}:`, error);
    }
  }
  
  return new Response(JSON.stringify({ success: true, sent }));
});
```

---

## Phase 7: Create Default Email Sequences

### 7.1 Seed Default Sequences

Create initial sequences for different lead sources:

```sql
-- Website Chat Lead Nurture
INSERT INTO public.email_sequences (name, description, is_active, send_delay_days, emails, design_style, writing_tone)
VALUES (
  'Website Lead Nurture',
  'Follow-up sequence for website chat leads',
  true,
  1,
  '[
    {"subject": "Thanks for chatting with us!", "html": "..."},
    {"subject": "Your vehicle wrap questions answered", "html": "..."},
    {"subject": "Ready to transform your ride?", "html": "..."}
  ]'::jsonb,
  'performance',
  'installer'
) ON CONFLICT DO NOTHING;

-- Quote Follow-up Sequence
INSERT INTO public.email_sequences (name, description, is_active, send_delay_days, emails, design_style, writing_tone)
VALUES (
  'Quote Follow-up',
  'Automated follow-up for quote requests',
  true,
  1,
  '[
    {"subject": "Your wrap quote is ready!", "html": "..."},
    {"subject": "Still thinking about your wrap?", "html": "..."},
    {"subject": "Last chance: Your quote expires soon", "html": "..."}
  ]'::jsonb,
  'performance',
  'installer'
) ON CONFLICT DO NOTHING;

-- Phone Lead Nurture
INSERT INTO public.email_sequences (name, description, is_active, send_delay_days, emails, design_style, writing_tone)
VALUES (
  'Phone Lead Nurture',
  'Follow-up for leads from phone calls',
  true,
  1,
  '[
    {"subject": "Great talking with you!", "html": "..."},
    {"subject": "Your wrap project next steps", "html": "..."}
  ]'::jsonb,
  'performance',
  'installer'
) ON CONFLICT DO NOTHING;
```

---

## Phase 8: MightyMail UI Enhancements

### 8.1 Add Contact Integration to MightyMailQuotes

Update `src/pages/MightyMailQuotes.tsx` to show contact linkage:

- Display `contact_id` linkage status
- Show contact tags (hot_lead, quoted, etc.)
- Link to MightyCustomer contact view

### 8.2 Add Sequence Management Dashboard

Create `src/pages/MightyMailSequences.tsx`:

- List all active sequences
- Show enrollment counts per sequence
- Enable/disable sequences
- Preview sequence emails

---

## Summary: Database Changes

| Type | Table | Change |
|------|-------|--------|
| ALTER | `contacts` | Add email marketing columns |
| ALTER | `email_sequence_enrollments` | Add `contact_id` FK |
| TRIGGER | `contacts` | `trg_contact_auto_enroll_sequence` |
| TRIGGER | `quotes` | `trg_quote_wire_to_email` |
| INSERT | `email_sequences` | Seed default sequences |

## Summary: Edge Function Changes

| Function | Change |
|----------|--------|
| `create-quote-from-chat` | Add sequence enrollment after quote |
| `process-phone-speech` | Add sequence enrollment for phone leads |
| NEW: `process-email-sequences` | CRON job to send sequence emails |

## Summary: UI Changes

| File | Change |
|------|--------|
| `MightyMailQuotes.tsx` | Show contact linkage |
| NEW: `MightyMailSequences.tsx` | Sequence management dashboard |

---

## Wiring Diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         LEAD SOURCES                                 │
├──────────────┬──────────────┬──────────────┬─────────────────────────┤
│  Website     │   Phone      │   Quote      │    SMS/Text             │
│   Chat       │   Call       │   Tool       │                         │
└──────┬───────┴──────┬───────┴──────┬───────┴─────────┬───────────────┘
       │              │              │                 │
       ▼              ▼              ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     CONTACTS TABLE (BRAIN)                           │
│  email, phone, source, tags, metadata, email_sends_count, etc.       │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
                        [TRIGGER: Auto-Enroll]
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  EMAIL_SEQUENCE_ENROLLMENTS                          │
│  contact_id → sequences based on source (chat/phone/quote)           │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
                         [CRON: process-email-sequences]
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         MIGHTYMAIL                                   │
│  Sends sequence emails via Resend, tracks opens/clicks               │
└──────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      EMAIL_TRACKING                                  │
│  Records sends, opens, clicks, bounces                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

After implementation:

| Metric | Expected |
|--------|----------|
| Every chat lead auto-enrolled | Yes |
| Every phone lead auto-enrolled | Yes |
| Every quote auto-enrolled | Yes |
| Contacts linked to enrollments | Yes |
| Email metrics on contacts | Yes |
| Unified customer view | Yes |

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Contact schema changes | Low | All columns are nullable with defaults |
| Enrollment triggers | Low | Exception handlers prevent failures |
| CRON sequence processor | Low | Runs independently, logs all errors |
| UI changes | Zero | Additive only |
