
# Fix White Outlines, Remove Phone Card & Wire MightyChat to Real Data

## Summary of Issues Found

1. **White Outline Problem**: The issue is that components are using `border-border` class alongside Card's built-in `border border-white/[0.03]`. This causes double borders—some from CSS variables, some from explicit Tailwind classes. Cards already have `border-white/[0.03]` baked into the component, so adding `border-border` duplicates it.

2. **Phone Calls Dashboard Card**: Currently shows on main dashboard redundantly since Phone tab exists in MightyChat.

3. **MightyChat Missing "Pending File Reviews"**: MightyChat card should show real pending file reviews count (114 pending in database), not generic "pending reviews".

4. **MightyChat Real Data Wiring**: Needs to pull from actual `conversations` table (Website Chat), `phone_calls` table (VAPI), and `ai_actions` table (File Reviews).

---

## Implementation Plan

### 1. Fix White Outline Issue

**File: `src/components/ui/card.tsx`**

Remove all border styling completely—make it borderless by default:

```typescript
// FROM:
className={cn("rounded-lg border border-white/[0.03] bg-card text-card-foreground shadow-sm", className)}

// TO:
className={cn("rounded-lg bg-card text-card-foreground shadow-sm", className)}
```

This eliminates ALL white outlines globally and gives a cleaner dark theme aesthetic.

### 2. Remove Phone Calls Dashboard Card

**File: `src/pages/Dashboard.tsx`**

- Remove `PhoneCallsDashboardCard` import and usage
- Change grid from 3 columns back to 2:

```typescript
// FROM:
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  <MightyChatCard />
  <MightyCustomerCard />
  <PhoneCallsDashboardCard />
</div>

// TO:
<div className="grid md:grid-cols-2 gap-4">
  <MightyChatCard />
  <MightyCustomerCard />
</div>
```

### 3. Wire MightyChat to Real Data

**File: `src/components/dashboard/MightyChatCard.tsx`**

Update to show:
- **Website Chat**: Count from `conversations` table where `channel = 'website_chat'`
- **Phone Calls**: Count from `phone_calls` table (new query)
- **Pending File Reviews**: Count from `ai_actions` table where `action_type = 'file_review' AND resolved = false`
- **Remove Instagram/Email channels** (V2 features)

New channel structure:
```typescript
const CHANNEL_CARDS = [
  { key: 'website', label: 'Website', icon: Globe, color: 'text-cyan-500' },
  { key: 'phone', label: 'Phone', icon: Phone, color: 'text-amber-500' },
  { key: 'fileReviews', label: 'File Reviews', icon: FileImage, color: 'text-purple-500' },
] as const;
```

Add new query for phone calls:
```typescript
const { data: phoneCount } = await supabase
  .from("phone_calls")
  .select("id", { count: "exact", head: true });
```

Update stats display:
- Show real pending file reviews count (currently 114)
- Wire to actual WebsiteAdmin pages when clicked

---

## Technical Details

| Change | File | Action |
|--------|------|--------|
| Remove card borders | `src/components/ui/card.tsx` | Remove `border border-white/[0.03]` |
| Remove Phone Card | `src/pages/Dashboard.tsx` | Delete import + usage |
| Wire MightyChat | `src/components/dashboard/MightyChatCard.tsx` | Add phone_calls query, add file_reviews count, remove email/instagram |

## Files to Modify

1. `src/components/ui/card.tsx` - Remove all border classes
2. `src/pages/Dashboard.tsx` - Remove PhoneCallsDashboardCard
3. `src/components/dashboard/MightyChatCard.tsx` - Wire to real data sources

---

## Result

- No more white outlines anywhere
- Phone is accessed only through MightyChat (no redundant card)
- MightyChat shows **"Pending File Reviews"** wired to real `ai_actions` data (114 pending)
- Website Chat and Phone counts pull from actual tables
