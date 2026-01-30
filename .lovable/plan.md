

# Implementation Plan: Website Chat Admin Enhancements

## Summary of Requirements

You've identified several issues and missing features in the Website Chat Admin:

1. **Transcripts need gradient+black styling** (like the chat widget)
2. **Duplicate emoji icons in quick actions** (visible in screenshot)
3. **Geo tracking visibility** - need to surface location data better
4. **Session details** - clarify what this shows
5. **AI quote request detection** → auto-escalate + start quote + ping internal team
6. **Internal email/upload from transcripts** - send emails and manage files directly
7. **Parse & store customer data** (names, company, emails) → MightyCustomer CMS
8. **Missing Vapi Phone messages/transcripts** - phone_calls table is empty
9. **Today's chat data** - currently showing 0 for today (last chat was Jan 29)

---

## Phase 1: UI/Theme Fixes

### 1.1 Apply Gradient+Black Theme to Transcripts

**Files to update:**
- `src/components/admin/ChatTranscriptViewer.tsx` - Transcript list and session details panel
- `src/components/admin/ChatDetailModal.tsx` - Full transcript modal view

**Changes:**
- Dark background: `#1a1a2e` with purple/magenta border accents
- Gradient header: `from-purple-600 via-fuchsia-600 to-pink-600`
- Message bubbles: Inbound = dark muted, Outbound = magenta-purple-pink gradient with glow
- Stats cards: Dark themed with gradient icon containers

### 1.2 Remove Duplicate Emoji Icons

**File:** `src/components/chat/WebsiteChatWidget.tsx`

**Issue:** Quick actions showing BOTH emoji and Lucide icons (e.g., "🚚 🚚 Bulk Order")

**Fix:** Remove the emoji from QUICK_ACTIONS leaving only Lucide React icons

---

## Phase 2: Geo Tracking & Session Details

### 2.1 Enhanced Geo Display

**Current state:** Geo data already exists in `metadata.geo` (confirmed in database - cities like Phoenix, Santa Rosa, San Diego, Atlanta are captured)

**Enhancements:**
- Add visual geo map/card in ChatDetailModal
- Show IP address, timezone, coordinates
- Add country flag emoji based on country code (already exists but make more prominent)
- Add geo search filter in ChatTranscriptViewer

### 2.2 Session Details Panel

**What it currently shows:**
- Customer name/email
- Start time
- Location (geo)
- Vehicle interest
- Message transcript preview

**Enhancements:**
- Add browser/device info if captured
- Add session duration
- Add page URL where chat started
- Add referrer source if available

---

## Phase 3: AI Quote Request Detection & Escalation

### 3.1 Current State

The `website-chat` edge function already:
- Detects pricing intent (`pricingIntent`)
- Routes quote requests to Alex Morgan via Ops Desk
- Sends escalation emails to team members
- Logs events to `conversation_events` table

### 3.2 Missing: Unresolved Quote Request Detection

**Problem:** If a visitor asks for a quote but never gets one (quote not created/sent), there's no automatic escalation to internal team.

**Solution:** Add new detection logic:

**Edge Function: `website-chat/index.ts`**
```
- Track `quote_requested_at` in chat_state when pricing intent detected
- If conversation ends (30+ min inactive) with quote_requested but no quote created:
  → Create ai_action for escalation
  → Send internal team alert
  → Route to Escalation Desk
```

**New: `run-orphan-quote-check` scheduled function**
- Runs hourly
- Finds conversations with:
  - `chat_state.quote_requested = true`
  - No linked quote in `quotes` table
  - Last message > 1 hour ago
- Creates escalation + pings internal team

### 3.3 Internal Team Notification

**Method:** Use existing `send-phone-alert` pattern to SMS Jackson
**Email:** Use Resend to email operations team

---

## Phase 4: Internal Email & File Management from Transcripts

### 4.1 Current State

`InternalReplyPanel.tsx` already supports:
- Composing/sending emails via `send-admin-reply`
- AI draft generation
- Attaching quotes via `QuoteSelector`

### 4.2 Missing: File Upload/Download

**Add to `ChatDetailModal.tsx` and `InternalReplyPanel.tsx`:**
- Upload button that saves to `media-library/chat-attachments/`
- File picker to attach uploaded files to email replies
- Download extracted customer files from "Check My File" submissions
- Display any files the customer uploaded during chat

**Component:** Create `ChatFileManager.tsx`
- List files associated with conversation
- Upload new files
- Attach to outbound emails

---

## Phase 5: Parse & Store Customer Data in MightyCustomer

### 5.1 Current State

Database triggers already exist:
- `trg_conversation_sync_contact` - syncs conversation to contacts table
- `trg_quote_sync_contact` - syncs quotes to contacts

Contacts table stores: name, email, phone, source, tags, metadata

### 5.2 Missing: Company Name Extraction

**Edge Function Update:** `website-chat/index.ts`

Add company name detection:
```javascript
const COMPANY_PATTERNS = /(?:(?:from|with|at|for|representing)\s+)?([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Co|Company|Services|Solutions|Fleet|Wraps))/i;
```

Store in `chat_state.customer_company` and sync to contacts table.

### 5.3 MightyCustomer Integration

**Current:** MightyCustomer accepts URL params for prefilling:
- `customer`, `email`, `phone`, `year`, `make`, `model`

**Enhancement:** Add "Open in MightyCustomer" button in ChatDetailModal that passes:
- Customer name, email, phone
- Company name
- Vehicle details
- Conversation ID for linking

---

## Phase 6: Phone Calls (Vapi/Twilio) Integration

### 6.1 Current State

The phone system is fully implemented:
- `receive-phone-call` edge function (Twilio webhooks)
- `process-phone-speech` for AI classification
- `phone_calls` table exists with proper schema
- UI components: `PhoneTranscriptView.tsx`, `PhoneCallsDashboardCard.tsx`

**Issue:** Database shows 0 phone calls - system hasn't received any calls yet (Twilio webhook may not be configured)

### 6.2 Verification Steps

1. Confirm Twilio webhook URL is set:
   - Voice URL: `https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/receive-phone-call`
   - Method: POST
   
2. Confirm Twilio phone number is provisioned

3. Test with a real call to verify pipeline

### 6.3 Add Phone Tab to WebsiteAdmin

The phone channel should appear in MightyChat under the unified inbox, not necessarily in WebsiteAdmin. However, we can add a "Phone Calls" stat card to the WebsiteAdmin dashboard.

---

## Phase 7: Today's Data Display

### 7.1 Current State

Query shows 0 chats today (Jan 30) - last chat was Jan 29. This is accurate data, not a bug.

### 7.2 Enhancement

- Ensure "Today Only" toggle works correctly with UTC timezone handling
- Add date range picker for more flexible filtering
- Show "No chats yet today" message vs "0" when empty
- Add realtime subscription to show new chats instantly

---

## Technical Implementation Order

1. **Quick wins (1 hour):**
   - Remove duplicate emoji icons
   - Apply gradient theme to transcript viewer
   - Enhance geo display

2. **File management (2 hours):**
   - Create ChatFileManager component
   - Wire to InternalReplyPanel
   - Add upload/download capabilities

3. **Quote detection & escalation (2 hours):**
   - Add orphan quote detection to website-chat
   - Create scheduled function for hourly checks
   - Wire to escalation system

4. **Company name parsing (1 hour):**
   - Add regex patterns to website-chat
   - Sync to contacts table
   - Display in ChatDetailModal

5. **Phone verification (1 hour):**
   - Test Twilio webhook
   - Add phone stats to dashboard
   - Verify MightyChat shows phone channel

---

## Files to Create/Modify

### Create:
- `src/components/admin/ChatFileManager.tsx` - File upload/download component

### Modify:
- `src/components/chat/WebsiteChatWidget.tsx` - Remove duplicate emojis
- `src/components/admin/ChatTranscriptViewer.tsx` - Gradient theme
- `src/components/admin/ChatDetailModal.tsx` - Gradient theme + file manager + geo display
- `src/components/admin/ChatTranscriptRow.tsx` - Enhanced geo display
- `supabase/functions/website-chat/index.ts` - Company name parsing + quote tracking
- `src/pages/WebsiteAdmin.tsx` - Add phone stats card

