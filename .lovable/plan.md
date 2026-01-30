

# Reduce Quick Action Buttons to 3

## Summary
Simplify the chat widget to show only 3 quick action buttons while keeping all the knowledge/functionality intact in the edge function.

---

## Current State (6 buttons)

| # | Label | Status |
|---|-------|--------|
| 1 | How much does a wrap cost? | ⚠️ Change text |
| 2 | How do I order? | ✅ Keep |
| 3 | Email my quote | ❌ Remove button |
| 4 | Order status | ❌ Remove button |
| 5 | Bulk / Fleet pricing | ❌ Remove button |
| 6 | Production time | ❌ Remove button |

---

## New State (3 buttons)

| # | Label | Icon | Style |
|---|-------|------|-------|
| 1 | **How much is my wrap project?** | 🚗 Car | Primary (orange) |
| 2 | **How do I order?** | 📦 Package | Secondary (purple) |
| 3 | **Ask me about RestyleProAI** | 🎨 Palette | Secondary (purple) |

---

## Technical Changes

### File: `src/components/chat/WebsiteChatWidget.tsx`

**Update QUICK_ACTIONS array (lines 14-21):**

```typescript
const QUICK_ACTIONS = [
  { icon: Car, label: "How much is my wrap project?", message: "How much is my wrap project?", primary: true },
  { icon: Package, label: "How do I order?", message: "How do I place an order?" },
  { icon: Palette, label: "Ask me about RestyleProAI", message: "Tell me about RestyleProAI and how it can help visualize my wrap" },
];
```

**Update button grid layout (lines 259-279):**

Change from 2-column grid to single column for the 2 secondary buttons:

```typescript
{/* Secondary Actions - Single column */}
<div className="space-y-2">
  {QUICK_ACTIONS.filter(a => !a.primary).map((action) => (
    // ... button code (no grid)
  ))}
</div>
```

---

## What Stays Unchanged

- ✅ Dark UI theme (`#1a1a2e`)
- ✅ Purple/magenta gradient header
- ✅ Typing animation effect
- ✅ All edge function knowledge (email quotes, order status, bulk pricing, production time)
- ✅ V3 edge function with 13 features
- ✅ RestylePro logic in AI responses

---

## Visual Result

```text
┌─────────────────────────────────┐
│  [J] Jordan                  [X]│  ← Header
├─────────────────────────────────┤
│                                 │
│  Hey! I'm Jordan with           │
│  WePrintWraps.com...            │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🚗 How much is my wrap  │    │  ← Primary (orange)
│  │       project?          │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📦 How do I order?      │    │  ← Secondary (purple)
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🎨 Ask me about         │    │  ← Secondary (purple)
│  │    RestyleProAI         │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│  [Type a message...]     [Send] │
│       Powered by weprintwraps   │
└─────────────────────────────────┘
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/chat/WebsiteChatWidget.tsx` | Reduce QUICK_ACTIONS to 3, update grid to single column |

---

## No Changes Needed

- `supabase/functions/website-chat/index.ts` - All knowledge intact (email, status, bulk, production)

