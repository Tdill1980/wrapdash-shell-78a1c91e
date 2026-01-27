
# Enhance ContactSidebar to Pass Vehicle Data

## Overview

Update the `ContactSidebar` component to fetch the conversation's `chat_state` and pass vehicle details (year, make, model) to MightyCustomer when creating quotes. This brings parity with the `ChatDetailModal` implementation.

---

## Current Gap

| Component | Passes Vehicle Data? | Status |
|-----------|---------------------|--------|
| ChatDetailModal | Yes - from `chatState.vehicle` | Complete |
| EscalationsDashboard | Yes - from `chat_state` query | Complete |
| ContactSidebar | **No** - only queries `contacts` table | **Needs Fix** |

---

## Implementation

### File: `src/components/mightychat/ContactSidebar.tsx`

**Changes Required:**

1. Add state for `chatState` to store conversation vehicle data
2. Add a new `useEffect` to fetch `chat_state` when `conversationId` changes
3. Update the "Create Quote" button to include vehicle parameters

---

## Technical Details

### Step 1: Add chatState State Variable

Add a new state variable to hold the conversation's chat_state:

```tsx
const [chatState, setChatState] = useState<{
  vehicle?: { year?: string; make?: string; model?: string };
} | null>(null);
```

### Step 2: Fetch chat_state from Conversations Table

Add a useEffect that queries the conversations table when conversationId is available:

```tsx
useEffect(() => {
  const loadChatState = async () => {
    if (!conversationId) {
      setChatState(null);
      return;
    }
    
    const { data, error } = await supabase
      .from("conversations")
      .select("chat_state")
      .eq("id", conversationId)
      .single();
    
    if (!error && data) {
      setChatState(data.chat_state as any);
    }
  };
  
  loadChatState();
}, [conversationId]);
```

### Step 3: Update Create Quote Button

Modify the onClick handler to include vehicle parameters:

```tsx
onClick={() => {
  const params = new URLSearchParams();
  params.set('mode', 'wpw_internal');
  if (conversationId) params.set('conversation_id', conversationId);
  if (contact.name) params.set('customer', contact.name);
  if (contact.email) params.set('email', contact.email);
  if (contact.phone) params.set('phone', contact.phone);
  // Add vehicle data from chat_state
  if (chatState?.vehicle?.year) params.set('year', chatState.vehicle.year);
  if (chatState?.vehicle?.make) params.set('make', chatState.vehicle.make);
  if (chatState?.vehicle?.model) params.set('model', chatState.vehicle.model);
  window.location.href = `/mighty-customer?${params.toString()}`;
}}
```

---

## Result After Implementation

| Component | conversation_id | customer | email | phone | year | make | model |
|-----------|----------------|----------|-------|-------|------|------|-------|
| ChatDetailModal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EscalationsDashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ContactSidebar | ✅ | ✅ | ✅ | ✅ | **✅** | **✅** | **✅** |

All three entry points will pass complete data to MightyCustomer, ensuring:
- Vehicle info auto-populates in the quote form
- Staff don't need to re-enter vehicle data manually
- Quotes are properly linked to source conversations
- Full MightyMail retargeting eligibility

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/mightychat/ContactSidebar.tsx` | Modify | Add chat_state fetch and pass vehicle params |

---

## No Breaking Changes

This enhancement:
- Does not modify any edge functions
- Does not change database schema
- Adds only additive fetch logic
- Preserves all existing "Check My File" and download functionality
