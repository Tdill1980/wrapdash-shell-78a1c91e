

# Complete Fix Plan: File Reviews, Hot Leads, CMS Contact Sync, and DNS Issue

## Executive Summary

You've identified **4 major issues** that need to be addressed:

1. **File Reviews (114) showing "No pending artwork reviews"** - The dashboard counts `file_review` actions, but the Artwork Reviews tab queries `artwork_review`. These are different action types!
2. **Hot Leads (200+) are not clickable/accessible** - The Hot Leads banner links to `/website-admin?filter=hot`, but that filter parameter is never read or used
3. **Chat data not saving to CMS/Contacts** - Contacts should be created for ALL chats, not just those with email
4. **DNS disconnection** - Your custom domain became "Offline" because DNS records changed or expired

---

## Issue 1: File Reviews Not Displaying

### Root Cause
There are **two different action types** in your database:
- `file_review` (114 records) - These are counted in the dashboard
- `artwork_review` (0 records) - This is what ArtworkReviewsPanel.tsx queries

The dashboard MightyChatCard counts:
```typescript
.eq("action_type", "file_review")  // Shows 114
```

But ArtworkReviewsPanel queries:
```typescript
.eq('action_type', 'artwork_review')  // Shows 0
```

### Solution
Modify `ArtworkReviewsPanel.tsx` to query BOTH action types and display full transcript with file preview, enabling chat review and customer reply.

**Changes to ArtworkReviewsPanel.tsx:**

1. Update query to fetch both `file_review` AND `artwork_review`:
```typescript
.in('action_type', ['file_review', 'artwork_review'])
```

2. Add conversation lookup to show full chat context:
   - Fetch the linked conversation via `action_payload.conversation_id`
   - Display message transcript alongside file preview
   - Add "Reply to Customer" button that opens the reply panel

3. Add file preview (for images: inline thumbnail; for PDFs: download link)

4. Keep "Mark Reviewed" and "Send Quote Link" actions

---

## Issue 2: Hot Leads Banner Not Working

### Root Cause
The Hot Leads banner in MightyChatCard navigates to:
```typescript
onClick={() => navigate("/website-admin?filter=hot")}
```

But WebsiteAdmin.tsx **never reads this `filter` parameter**. It only reads `tab`:
```typescript
const initialTab = searchParams.get("tab") || "chats";
```

### Solution
Modify WebsiteAdmin.tsx and ChatTranscriptViewer.tsx to:

1. Read the `filter=hot` query parameter
2. Auto-apply a "Hot Leads only" filter when present
3. Show only conversations that have pending quote-related `ai_actions`

**Changes:**

1. **WebsiteAdmin.tsx** - Pass filter param to ChatSessionsTab:
```typescript
const filter = searchParams.get("filter"); // "hot" or null
<ChatSessionsTab initialFilter={filter} />
```

2. **ChatTranscriptViewer.tsx** - Add hot lead filter:
   - Add state: `const [hotLeadsOnly, setHotLeadsOnly] = useState(initialFilter === 'hot')`
   - Fetch conversation IDs that have pending quote actions from `ai_actions`
   - Filter conversations to only those IDs when `hotLeadsOnly` is true
   - Add a toggle button to switch between "Hot Leads Only" and "All Chats"

3. **Each row click** opens ChatDetailModal with:
   - Full transcript visible
   - Reply button (if email exists)
   - Create Quote button that pre-fills MightyCustomer

---

## Issue 3: CMS Contact Sync for ALL Chats

### Root Cause
The current trigger `trg_conversation_sync_contact` only creates contacts when email is present. You want contacts created for ALL chats, even anonymous ones.

### Solution

1. **Modify database trigger** to always create a contact:
```sql
-- Update sync_conversation_to_contact function
-- Create contact even if email is null
-- Use session_id as fallback identifier
-- Set source = 'chat' and status = 'anonymous_lead'
-- Store vehicle info, location, page_url in metadata
```

2. **Add conversation data fields** to the contact:
   - `last_chat_at` timestamp
   - `chat_summary` (first/last message snippets)
   - `vehicle_interest` (from chat_state.vehicle)
   - `location` (from geo data)

3. **Merge logic** - When email IS later captured:
   - Find existing anonymous contact for that session
   - Update it with email instead of creating duplicate

---

## Issue 4: DNS Disconnection for wrapcommandai.com

### Explanation

This is a **DNS configuration issue**, not a code issue. Based on Lovable documentation:

When a custom domain shows "Offline" status, it means:
- The DNS records are no longer pointing to Lovable's servers
- This happens when DNS settings change at your domain registrar (intentionally or via expiration)

### How to Fix

1. Go to **Project Settings → Domains** in Lovable
2. Click on `wrapcommandai.com` - you should see status "Offline"
3. Click **"Recover"** or **"Check Status"**
4. Lovable will show the required DNS records
5. At your domain registrar (GoDaddy, Namecheap, etc.), verify:
   - **A Record** for `@` → `185.158.133.1`
   - **A Record** for `www` → `185.158.133.1`
   - **TXT Record** `_lovable` → the verification value shown
6. Wait 24-72 hours for DNS propagation

Common causes of "sudden" disconnection:
- Domain auto-renewal failed
- DNS provider reset records during maintenance
- CAA records blocking SSL certificate renewal
- Conflicting A/CNAME records were added

---

## Technical Implementation Details

### File 1: ArtworkReviewsPanel.tsx

| Line Range | Change |
|------------|--------|
| 64-69 | Change `.eq('action_type', 'artwork_review')` to `.in('action_type', ['file_review', 'artwork_review'])` |
| New | Add conversation fetch for each review using `action_payload.conversation_id` |
| New | Add transcript display section (collapsible or inline) |
| New | Add "View Full Chat" button to open ChatDetailModal |
| 267-294 | Enhance action buttons - keep Download, Send Quote Link, add "Reply to Customer" |

### File 2: WebsiteAdmin.tsx

| Line Range | Change |
|------------|--------|
| 26 | Add `const filter = searchParams.get("filter");` |
| 194-198 | Pass `initialFilter={filter}` to ChatSessionsTab |

### File 3: ChatTranscriptViewer.tsx

| Line Range | Change |
|------------|--------|
| 50-53 | Add `initialFilter` prop and hot-lead toggle state |
| New | Add query to fetch conversation IDs with pending `create_quote`, `auto_quote_generated`, or `quote_request` actions |
| 69-100 | Add hot lead filter to `filteredConversations` |
| 196-218 | Add "Hot Leads Only" toggle button to the Escalation quick filters area |

### File 4: Database Trigger (SQL Migration)

```sql
CREATE OR REPLACE FUNCTION sync_conversation_to_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
    -- Has email: find by email or create
    SELECT id INTO v_contact_id FROM public.contacts
    WHERE organization_id = NEW.organization_id 
    AND LOWER(email) = LOWER(v_email)
    LIMIT 1;
  ELSIF v_session_id IS NOT NULL THEN
    -- No email: find by session_id in metadata or create anonymous
    SELECT id INTO v_contact_id FROM public.contacts
    WHERE organization_id = NEW.organization_id 
    AND metadata->>'session_id' = v_session_id
    LIMIT 1;
  END IF;
  
  IF v_contact_id IS NULL THEN
    -- Create new contact (anonymous if no email)
    INSERT INTO public.contacts (
      organization_id, name, email, phone, source, 
      metadata, tags
    ) VALUES (
      NEW.organization_id,
      COALESCE(v_name, 'Website Visitor'),
      CASE WHEN v_email != '' THEN LOWER(v_email) ELSE NULL END,
      v_phone,
      'chat',
      jsonb_build_object(
        'session_id', v_session_id,
        'first_conversation_id', NEW.id,
        'vehicle', NEW.chat_state->'vehicle',
        'geo', NEW.metadata->'geo'
      ),
      CASE WHEN v_email IS NULL OR v_email = '' 
           THEN ARRAY['anonymous_lead'] 
           ELSE ARRAY[]::text[] END
    ) RETURNING id INTO v_contact_id;
  ELSE
    -- Update existing contact
    UPDATE public.contacts SET
      name = COALESCE(NULLIF(v_name, 'Website Visitor'), name),
      phone = COALESCE(v_phone, phone),
      email = COALESCE(NULLIF(v_email, ''), email),
      metadata = metadata || jsonb_build_object(
        'last_conversation_id', NEW.id,
        'vehicle', COALESCE(NEW.chat_state->'vehicle', metadata->'vehicle')
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
$$;
```

---

## Summary of All Changes

| Component | Change | Purpose |
|-----------|--------|---------|
| ArtworkReviewsPanel.tsx | Query both `file_review` AND `artwork_review` action types | Show all 114+ file reviews |
| ArtworkReviewsPanel.tsx | Add transcript display and conversation link | Enable reading chat context |
| ArtworkReviewsPanel.tsx | Add "Reply to Customer" button | Enable replying from review panel |
| WebsiteAdmin.tsx | Read `filter` query parameter | Enable hot lead filter from dashboard |
| ChatTranscriptViewer.tsx | Add hot lead filtering logic | Show only conversations with pending quote actions |
| ChatTranscriptViewer.tsx | Add "Hot Leads Only" toggle | Easy switching between all chats and hot leads |
| Database trigger | Always create contact (anonymous if no email) | CMS receives all leads |
| Database trigger | Store session_id, vehicle, geo in contact metadata | Rich lead data for CMS |
| DNS configuration | Verify and update DNS records at registrar | Fix domain connectivity |

---

## Expected Results After Implementation

1. **File Reviews tab** → Shows 114+ items with full chat transcripts, file previews, and reply capability
2. **Hot Leads banner** → Clicking shows filtered list of 200+ conversations with pending quotes
3. **Each conversation** → Clickable to open full transcript with Reply and Create Quote actions
4. **Contacts table** → Creates record for EVERY chat, even anonymous ones
5. **wrapcommandai.com** → Back online after DNS recovery

