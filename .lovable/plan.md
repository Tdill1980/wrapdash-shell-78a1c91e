

# Wire Escalation Desk to MightyCustomer with Create Quote Button

## Overview

Add a "Create Quote" button to the Escalation Desk that navigates to MightyCustomer with full context (conversation_id, customer name, email, phone, and vehicle details from chat_state). This enables staff to create quotes directly from escalated conversations while maintaining the existing "Check My File" download, artwork review, and AI chat features.

---

## Current State Analysis

### What Exists

| Component | Location | Current Behavior |
|-----------|----------|------------------|
| EscalationsDashboard | `src/components/admin/EscalationsDashboard.tsx` | Shows escalation queue, clicking opens Chat tab - no quote creation button |
| MightyCustomer | `src/pages/MightyCustomer.tsx` | Already accepts URL params: `conversation_id`, `customer`, `email`, `phone`, `year`, `make`, `model`, `mode` |
| ContactSidebar | `src/components/mightychat/ContactSidebar.tsx` | Has "Create Quote" button but only passes `customer` and `email` - missing `conversation_id` |
| ChatDetailModal | `src/components/admin/ChatDetailModal.tsx` | Shows conversation details with Quotes tab, but no direct "Create Quote" link to MightyCustomer |
| Check My File | ArtworkReviewsPanel, ChatTranscriptRow | Download button already works - exports JSON with messages |

### Data Available in Escalation Item

From the `EscalationsDashboard.tsx` query:

```text
- conversationId (from conversation_events)
- contactName (from contacts.name)
- contactEmail (from contacts.email)
- contactPhone (from contacts.phone)
- Vehicle info available in conversation.chat_state.vehicle (year, make, model)
```

---

## Implementation Plan

### Step 1: Enhance EscalationsDashboard with Create Quote Button

**File:** `src/components/admin/EscalationsDashboard.tsx`

Add a "Create Quote" button to each escalation row that:
1. Fetches the conversation's `chat_state` to get vehicle details
2. Navigates to MightyCustomer with full URL parameters

Changes:
- Add a new query to fetch `chat_state` for selected conversation
- Add `Receipt` icon import from lucide-react
- Add "Create Quote" button in the quick actions area (alongside "Open in Chat" and "Quick Resolve")
- Button navigates to: `/mighty-customer?mode=wpw_internal&conversation_id={id}&customer={name}&email={email}&phone={phone}&year={year}&make={make}&model={model}`

### Step 2: Fix ContactSidebar to Pass conversation_id

**File:** `src/components/mightychat/ContactSidebar.tsx`

Update the existing "Create Quote" button to include `conversation_id` so quotes are linked:

```tsx
// Current (broken)
onClick={() => window.location.href = `/mighty-customer?customer=${...}&email=${...}`}

// Fixed
onClick={() => navigate(`/mighty-customer?mode=wpw_internal&conversation_id=${conversationId}&customer=${...}&email=${...}&phone=${...}`)}
```

### Step 3: Add Create Quote to ChatDetailModal Quick Actions

**File:** `src/components/admin/ChatDetailModal.tsx`

Add a "Create Quote" button in the Quick Actions card that opens MightyCustomer with full context:
- Uses conversation.id, contact.name, contact.email, contact.phone
- Pulls vehicle from chat_state.vehicle

---

## Data Flow

```text
+-------------------+     +------------------------+     +------------------+
| EscalationsDashboard | --> | Click "Create Quote"     | --> | MightyCustomer   |
| (conversation_id,   |     | Builds URL with:         |     | Pre-fills:       |
| contact info,       |     | - conversation_id        |     | - Customer name  |
| escalation type)    |     | - customer name          |     | - Email          |
+-------------------+     | - email, phone           |     | - Phone          |
                          | - vehicle Y/M/M          |     | - Vehicle info   |
                          +------------------------+     | - Links quote to |
                                                         |   conversation   |
                                                         +------------------+
                                                                   |
                                                                   v
                                                         +------------------+
                                                         | quotes table     |
                                                         | source_conversation_id |
                                                         | set correctly    |
                                                         +------------------+
```

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/admin/EscalationsDashboard.tsx` | Modify | Add "Create Quote" button to escalation rows, fetch chat_state for vehicle info |
| `src/components/mightychat/ContactSidebar.tsx` | Modify | Fix "Create Quote" button to pass conversation_id and phone |
| `src/components/admin/ChatDetailModal.tsx` | Modify | Add "Create Quote" button in Quick Actions section |

---

## Technical Details

### EscalationsDashboard Changes

1. Add `useNavigate` import from react-router-dom
2. Expand the query to include `chat_state` from conversations table
3. Add `Receipt` icon import
4. Add new button in the quick actions `<div>`:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-7 w-7 text-muted-foreground hover:text-green-600"
  onClick={(e) => {
    e.stopPropagation();
    const vehicle = chatStates[item.conversationId]?.vehicle || {};
    const params = new URLSearchParams({
      mode: 'wpw_internal',
      conversation_id: item.conversationId,
      customer: item.contactName || '',
      email: item.contactEmail || '',
      phone: item.contactPhone || '',
      year: vehicle.year || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
    });
    navigate(`/mighty-customer?${params.toString()}`);
  }}
  title="Create Quote"
>
  <Receipt className="h-4 w-4" />
</Button>
```

### ContactSidebar Changes

1. Add `conversationId` to component usage (already passed as prop)
2. Update button onClick to include all parameters:

```tsx
<Button 
  variant="outline" 
  size="sm" 
  className="w-full justify-start"
  onClick={() => {
    const params = new URLSearchParams({
      mode: 'wpw_internal',
      ...(conversationId && { conversation_id: conversationId }),
      customer: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
    });
    window.location.href = `/mighty-customer?${params.toString()}`;
  }}
>
  <FileText className="w-4 h-4 mr-2" />
  Create Quote
</Button>
```

### ChatDetailModal Changes

Add a button in the Quick Actions card:

```tsx
<Button
  variant="default"
  className="w-full gap-2 justify-start bg-green-600 hover:bg-green-700"
  size="sm"
  onClick={() => {
    const vehicle = chatState?.vehicle || {};
    const params = new URLSearchParams({
      mode: 'wpw_internal',
      conversation_id: conversation.id,
      customer: contact?.name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      year: vehicle.year || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
    });
    window.open(`/mighty-customer?${params.toString()}`, '_blank');
  }}
>
  <Receipt className="h-4 w-4" />
  Create Quote in MightyCustomer
</Button>
```

---

## Preserved Features (No Changes)

| Feature | File | Status |
|---------|------|--------|
| Chat transcript download | ChatTranscriptRow.tsx | Preserved - downloads JSON |
| Artwork reviews panel | ArtworkReviewsPanel.tsx | Preserved - download button intact |
| Check My File workflow | website-chat, check-artwork-file edge functions | Preserved - no changes |
| AI chat capabilities | AgentChatPanel.tsx | Preserved - no changes |
| MightyMail retargeting | quotes table, run-quote-followups | Preserved - quotes will auto-retarget |
| Existing quote creation flow | MightyCustomer.tsx | Preserved - adding params doesn't break existing |

---

## Result

After implementation:
- Staff can click "Create Quote" directly from an escalation row
- MightyCustomer opens pre-filled with customer name, email, phone, and vehicle info
- Quote is automatically linked to the source conversation via `source_conversation_id`
- Quote appears in the ChatDetailModal Quotes tab
- Quote is eligible for MightyMail retargeting (auto_retarget: true for non-WPW-internal)
- All existing download/export functionality remains intact

