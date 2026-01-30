

# Create New Ops Page

## What You Want
Create a dedicated **Ops** page that combines:
1. **Ops Desk Command Panel** — The directive input for assigning tasks to agents
2. **Agent Control Panel** — Force Start, Emergency Stop, Master Toggle, and Schedule settings

The Website Chat Admin page at `/website-admin` stays exactly as it is — no changes.

---

## Changes Required

### 1. Create New Page: `/ops`
**New file:** `src/pages/Ops.tsx`

| Section | Component | Purpose |
|---------|-----------|---------|
| Header | Page title "Ops" | Clear identification |
| Panel 1 | `OpsDeskCommandPanel` | Natural language directives for agents |
| Panel 2 | `AgentControlPanel` | Force Start, Emergency Stop, Schedule |

Structure:
```text
Ops.tsx
├── Auth check (redirect to /auth if not logged in)
├── Page Header: "Ops" with icon
├── OpsDeskCommandPanel (directive input section)
└── AgentControlPanel (Jordan controls section)
```

---

### 2. Add Route
**File:** `src/App.tsx`

Add new route:
```text
<Route path="/ops" element={<Ops />} />
```

---

### 3. Add Sidebar Navigation
**File:** `src/components/Sidebar.tsx`

Add to the **Admin** section (since these are high-level controls):
```text
{ 
  name: "Ops", 
  path: "/ops", 
  icon: Zap,
  roles: ["admin"],
  customRender: (styled text)
}
```

---

### 4. Simplify Systems Page (Optional)
The existing `/systems` page can be simplified since Agent Control is moving to `/ops`:
- Keep Integrations tab (placeholder)
- Keep Security tab (placeholder)
- Remove Agent Control tab (now in Ops)

---

## What Stays the Same

| Page | URL | Status |
|------|-----|--------|
| Website Chat | `/website-admin` | ✅ **NO CHANGES** |
| Dashboard | `/dashboard` | ✅ **NO CHANGES** |
| MightyCustomer | `/mighty-customer` | ✅ **NO CHANGES** |

---

## Result After Implementation

| Sidebar Item | Route | What It Contains |
|--------------|-------|------------------|
| Website Chat | `/website-admin` | Chat sessions, escalations, quotes, analytics |
| **Ops** | `/ops` | Ops Desk commands + Agent Control Panel |
| Systems | `/systems` | Integrations & Security settings |

---

## Technical Summary

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/Ops.tsx` | New Ops page combining both panels |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/ops` route |
| `src/components/Sidebar.tsx` | Add "Ops" nav item |
| `src/pages/Systems.tsx` | Remove Agent Control tab (optional) |

