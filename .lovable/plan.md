
# Fix Hot Leads Count & Consolidate Escalation Types

## Problem Analysis

### Issue 1: Hot Leads Shows 0
**Current logic** queries:
- `phone_calls.is_hot_lead = true` → Returns 0
- `conversations.escalated = true` → Returns 0

**Correct definition**: A hot lead is a quote request not yet marked complete. The database shows:
- 182 `auto_quote_generated` (unresolved)
- 34 `create_quote` (unresolved)
- **Total: 216 pending quote requests** should be hot leads!

### Issue 2: Escalation Types Not Consolidated
**Current database subtypes:**
| Subtype | Count | Problem |
|---------|-------|---------|
| `bulk_inquiry` | 19 | Separate from... |
| `bulk_inquiry_with_email` | 13 | ...this one |
| `jackson` | 7 | Named after person, not category |
| `quality_issue` | 6 | Separate from... |
| `unhappy_customer` | 2 | ...this one |
| `lance` | 9 | Quote requests (belongs in MightyChat) |
| `design` | 7 | OK as-is |

---

## Solution

### 1. MightyChatCard - Fix Hot Leads Query

Change hot leads to count **unresolved quote requests** from `ai_actions`:

```typescript
// NEW: Hot leads = pending quote requests (any type, not resolved)
const { count: hotLeadsCount } = await supabase
  .from("ai_actions")
  .select("id", { count: "exact", head: true })
  .eq("resolved", false)
  .in("action_type", ["create_quote", "auto_quote_generated", "quote_request"]);

setStats({
  ...
  hotLeads: hotLeadsCount || 0,  // Will show 216 instead of 0
  ...
});
```

Remove the separate `pendingQuotes` stat since it's redundant (same as hot leads).

### 2. EscalationsDashboardCard - Consolidate Subtypes

Update subtype mapping to group related categories:

```typescript
// Consolidation map - multiple DB subtypes → single display category
const consolidationMap: Record<string, string> = {
  'bulk_inquiry': 'bulk',
  'bulk_inquiry_with_email': 'bulk',
  'jackson': 'sales',
  'quality_issue': 'unhappy',
  'unhappy_customer': 'unhappy',
  'design': 'design',
  'lance': 'quote',  // Standard quotes
};

const subtypeLabels = {
  'bulk': { label: 'Bulk Quote', icon: Package, color: 'text-purple-500' },
  'sales': { label: 'Sales Escalation', icon: Phone, color: 'text-blue-500' },
  'unhappy': { label: 'Unhappy Customer', icon: Frown, color: 'text-orange-500' },
  'design': { label: 'Design Review', icon: Palette, color: 'text-pink-500' },
};
```

---

## Expected Result

### MightyChatCard
```
┌────────────────────────────────────────────────┐
│  MightyChat                    [Open Inbox →]  │
├────────────────────────────────────────────────┤
│  🔥 216 Hot Leads              [Click to view] │
│                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Website  │ │  Phone   │ │ File Reviews │   │
│  │  Chat    │ │  Agent   │ │              │   │
│  │   42     │ │   15     │ │     114      │   │
│  └──────────┘ └──────────┘ └──────────────┘   │
│                                                │
│  💬 Real-time conversations                    │
└────────────────────────────────────────────────┘
```

### EscalationsDashboardCard
```
┌────────────────────────────────────────┐
│  ⚠️ Escalations                    63  │
├────────────────────────────────────────┤
│  📦 Bulk Quote                      32 │  ← (19 + 13 combined)
│  📞 Sales Escalation                 7 │  ← (jackson renamed)
│  😟 Unhappy Customer                 8 │  ← (6 + 2 combined)
│  🎨 Design Review                    7 │
│                                        │
│  → Review Queue                        │
└────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/MightyChatCard.tsx` | Fix hot leads query to count unresolved ai_actions quote requests |
| `src/components/dashboard/EscalationsDashboardCard.tsx` | Add consolidation map to group subtypes, update labels |

---

## Technical Details

### MightyChatCard Changes
1. Replace hot leads query with `ai_actions` count where `resolved = false` and `action_type` in quote types
2. Remove redundant `pendingQuotes` stat (same data as hot leads)
3. Update footer to remove quote request count (now shown as hot leads)

### EscalationsDashboardCard Changes
1. Add `consolidationMap` to normalize database subtypes to display categories
2. Update grouping logic to consolidate counts before display
3. Add new icons: `Frown` for unhappy customers, `Palette` for design, `Phone` for sales
4. Remove `lance` from escalations (standard quotes belong in MightyChat hot leads)
