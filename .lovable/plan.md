
# Wire Phone Agent & Website Chat into MightyChat

## Executive Summary
This plan integrates the **Vidio Phone Agent** (Taylor Phone) and **Website Chat** (Jordan Lee) into the MightyChat system, enabling staff to manage all customer touchpoints from one unified inbox. The goal is to create a seamless workflow where pricing questions from website chat or phone calls flow into MightyChat → Create Quote in MightyCustomer → Reply back via chat or call.

---

## Current State Analysis

### What Already Exists (Protected - No Changes)
| Component | Status | Notes |
|-----------|--------|-------|
| `public/embed/chat-widget.js` | ✅ Production | Jordan AI, Check My File, Order Status |
| `phone_calls` database table | ✅ Complete | Has `conversation_id` FK to conversations |
| `PhoneCallCard.tsx` | ✅ Built | Card UI for phone calls |
| `PhoneTranscriptView.tsx` | ✅ Built | Transcript viewer with AI summary |
| `PhoneCallsDashboardCard.tsx` | ✅ Built | Dashboard stats card |
| `ReviewQueue.tsx` | ✅ Working | Has Phone/Website tabs already |
| Edge functions (`receive-phone-call`, `process-phone-speech`, `website-chat`) | ✅ Production | Don't touch |

### What's Missing
1. **Website Chat** work stream in MightyChat Inbox sidebar
2. **Phone Calls** work stream in MightyChat Inbox sidebar  
3. **Call Back / SMS** buttons in ContactSidebar and EscalationsDashboard
4. **Website/Phone** channels loading in AgentMightyChatLayout conversation list

---

## Implementation Plan

### Phase 1: Add Website Chat & Phone to WorkStreamsSidebar

**File: `src/components/mightychat/WorkStreamsSidebar.tsx`**

Add two new stream configurations:

```text
STREAMS array additions (lines 19-68):

{ 
  id: "website", 
  label: "Website Chat", 
  agentName: "Jordan Lee",
  inboxLabel: "weprintwraps.com",
  icon: <Globe className="w-4 h-4" />,
  color: "text-cyan-500",
  activeColor: "bg-cyan-500/10 border-cyan-500/50 text-cyan-600 shadow-sm"
},
{ 
  id: "phone", 
  label: "Phone Calls", 
  agentName: "Taylor Phone",
  inboxLabel: "AI Phone Agent",
  icon: <Phone className="w-4 h-4" />,
  color: "text-amber-500",
  activeColor: "bg-amber-500/10 border-amber-500/50 text-amber-600 shadow-sm"
}
```

Update `WorkStream` type:
```typescript
export type WorkStream = "hello" | "design" | "jackson" | "dms" | "ops" | "website" | "phone";
```

---

### Phase 2: Update MightyChatShell WorkStream Type

**File: `src/components/mightychat/MightyChatShell.tsx`**

Update the import and type to include website and phone:
```typescript
export type MightyMode = "chat" | "ops" | "review" | "history" | "agents";
// WorkStream type is imported from WorkStreamsSidebar, no change needed here
```

---

### Phase 3: Wire AgentMightyChatLayout to Load Website/Phone Conversations

**File: `src/components/mightychat/AgentMightyChatLayout.tsx`**

**Change 1:** Update `loadConversations` query to include website and phone channels (line ~369):

```typescript
// Current: .in("channel", ["instagram", "facebook", "messenger", "email"])
// Change to:
.in("channel", ["instagram", "facebook", "messenger", "email", "website", "website_chat", "phone"])
```

**Change 2:** Update `getConversationStream` function (lines ~437-454) to route website/phone:

```typescript
const getConversationStream = (conv: Conversation): WorkStream => {
  const channel = conv.channel?.toLowerCase() || '';

  // Social DMs
  if (channel === 'instagram' || channel === 'facebook' || channel === 'messenger') return 'dms';

  // Website chat (Jordan Lee)
  if (channel === 'website' || channel === 'website_chat') return 'website';

  // Phone calls (Taylor Phone)
  if (channel === 'phone') return 'phone';

  // Email routing based on inbox
  if (channel === 'email') {
    const inbox = conv.recipient_inbox?.toLowerCase() || '';
    if (inbox.includes('design')) return 'design';
    if (inbox.includes('jackson')) return 'jackson';
    return 'hello';
  }

  return 'hello';
};
```

**Change 3:** Update stream counts computation (~lines 465-472):
```typescript
const streamCounts = useMemo(() => {
  const counts: Record<WorkStream, number> = { 
    hello: 0, design: 0, jackson: 0, dms: 0, ops: 0, website: 0, phone: 0 
  };
  // ... rest unchanged
}, [conversations]);
```

---

### Phase 4: Add Call Back / SMS Buttons to ContactSidebar

**File: `src/components/mightychat/ContactSidebar.tsx`**

Add two new action buttons after the "Create Quote" button (around line 290):

```tsx
{/* Call Back button - only if contact has phone */}
{contact.phone && (
  <Button 
    variant="outline" 
    size="sm" 
    className="w-full justify-start text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
    onClick={() => window.open(`tel:${contact.phone}`, '_self')}
  >
    <Phone className="w-4 h-4 mr-2" />
    Call Back
  </Button>
)}

{/* SMS button - only if contact has phone */}
{contact.phone && (
  <Button 
    variant="outline" 
    size="sm" 
    className="w-full justify-start text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
    onClick={() => window.open(`sms:${contact.phone}`, '_self')}
  >
    <MessageSquare className="w-4 h-4 mr-2" />
    Send SMS
  </Button>
)}
```

---

### Phase 5: Add Call Back Button to EscalationsDashboard

**File: `src/components/admin/EscalationsDashboard.tsx`**

Add a Call Back button in the quick actions section (around line 350, after the Receipt button):

```tsx
{/* Call Back button - only if contact has phone */}
{item.contactPhone && (
  <Button
    variant="ghost"
    size="icon"
    className="h-7 w-7 text-muted-foreground hover:text-amber-500"
    onClick={(e) => {
      e.stopPropagation();
      window.open(`tel:${item.contactPhone}`, '_self');
    }}
    title="Call Back"
  >
    <Phone className="h-4 w-4" />
  </Button>
)}
```

---

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER TOUCHPOINTS                            │
├────────────┬────────────┬────────────┬────────────┬────────────────────┤
│  Website   │   Phone    │   Email    │ Instagram  │      Facebook      │
│   Chat     │   Call     │            │            │                    │
│ (Jordan)   │ (Taylor)   │            │            │                    │
└─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┴──────────┬─────────┘
      │            │            │            │                 │
      ▼            ▼            ▼            ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      conversations TABLE                                │
│  channel: website | phone | email | instagram | facebook                │
│  + contacts FK, chat_state (vehicle info), messages                     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MIGHTYCHAT SHELL                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Review   │  │  Inbox   │  │  Agents  │  │ History  │  │ Ops Desk │  │
│  │  Queue   │  │          │  │          │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                      WORK STREAMS SIDEBAR                               │
│  ┌─────────────────┐                                                    │
│  │ hello@ Inbox    │ ← Alex Morgan (email)                              │
│  │ design@ Inbox   │ ← Grant Miller (email)                             │
│  │ jackson@ Inbox  │ ← Jackson Ops (email)                              │
│  │ Social DMs      │ ← Casey Ramirez (Instagram/Facebook)               │
│  │ Website Chat    │ ← Jordan Lee (weprintwraps.com) ★ NEW              │
│  │ Phone Calls     │ ← Taylor Phone (AI Phone Agent) ★ NEW              │
│  │ Ops Desk        │ ← Approvals & Routing                              │
│  └─────────────────┘                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                      CONTACT SIDEBAR                                    │
│  ┌─────────────────┐                                                    │
│  │ Create Quote    │ → Opens MightyCustomer with vehicle data           │
│  │ Call Back       │ → tel: link (if phone exists) ★ NEW                │
│  │ Send SMS        │ → sms: link (if phone exists) ★ NEW                │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MIGHTYCUSTOMER                                   │
│  Pre-populated with: customer, email, phone, year, make, model          │
│  Quote created → Reply in chat OR Call back                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `WorkStreamsSidebar.tsx` | Add website + phone streams, update type | Low |
| `AgentMightyChatLayout.tsx` | Load website/phone channels, update routing | Low |
| `ContactSidebar.tsx` | Add Call Back + SMS buttons | Low |
| `EscalationsDashboard.tsx` | Add Call Back button | Low |

---

## Protected Files (NO CHANGES)

- `public/embed/chat-widget.js` - Production widget
- All edge functions (`website-chat`, `receive-phone-call`, `process-phone-speech`, etc.)
- Database schema (already has `phone_calls.conversation_id` FK)
- `ReviewQueue.tsx` - Already has Phone/Website tabs working

---

## Testing Checklist

After implementation:
1. **Website Chat Stream**: Verify website conversations appear in "Website Chat" work stream
2. **Phone Calls Stream**: Verify phone calls appear in "Phone Calls" work stream
3. **Call Back Button**: Click "Call Back" in ContactSidebar → triggers phone dialer
4. **SMS Button**: Click "Send SMS" → triggers SMS app
5. **Create Quote Flow**: Open website chat → Create Quote → MightyCustomer pre-fills vehicle data
6. **Escalation Call Back**: Click phone icon on escalation → triggers dialer

---

## Technical Notes

- The `phone_calls` table already has `conversation_id` FK to `conversations` - no schema changes needed
- Phone calls are already inserted into conversations with `channel: "phone"` by the `process-phone-speech` edge function
- Website chats use `channel: "website"` or `channel: "website_chat"` 
- All routing logic is additive - existing email/DM flows remain unchanged
