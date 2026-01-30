

# Fix Plan: Grayed-Out Buttons & Missing Dimension Input in MightyCustomer

## Issues Identified

### 1. "Save Quote" Button is Grayed Out
**Location:** `src/pages/MightyCustomer.tsx` line 1134

**Current Condition:**
```typescript
disabled={isSavingQuote || !selectedProduct || !total || !customerData.name || !customerData.email}
```

**Why it's grayed:** The button requires ALL of these to be true:
- A product must be selected
- A total must be calculated (which requires SQFT > 0)
- Customer name must be entered
- Customer email must be entered

**Problem:** If the vehicle isn't in the database and SQFT is 0, there's no way to get a `total > 0`, so the button stays disabled.

---

### 2. "Send Quote Email" Button is Grayed Out
**Location:** `src/pages/MightyCustomer.tsx` line 1153

**Current Condition:**
```typescript
disabled={isSendingEmail || !selectedProduct || !total || !customerData.email || !customerData.name}
```

Same issue — requires `total > 0` which requires SQFT.

---

### 3. No Direct Dimension Input for Trailers/Custom Vehicles
**Current behavior:** 
- The SQFT input box exists (line 930-936), but it only shows after selecting a vehicle
- Users cannot easily enter Length × Height dimensions for trailers or custom items
- The formula to convert dimensions to SQFT (e.g., 14ft × 6ft × 2 sides = 168 sqft) isn't exposed

---

## Implementation Plan

### Fix 1: Always Allow "Save Quote" (Remove Email Requirement)
**File:** `src/pages/MightyCustomer.tsx`
**Line:** 1134

**Change:**
```typescript
// Before:
disabled={isSavingQuote || !selectedProduct || !total || !customerData.name || !customerData.email}

// After - Allow saving without email (can add email later):
disabled={isSavingQuote || !selectedProduct || !total}
```

**Reasoning:** Saving a quote to the database shouldn't require an email — that's only needed for *sending* the quote.

---

### Fix 2: Make SQFT Input Always Visible (Not Gated by Vehicle Match)
**File:** `src/pages/MightyCustomer.tsx`
**Lines:** 874-940 (the SQFT display section)

**Current issue:** The SQFT input is inside a conditional block that may not render if vehicle data isn't complete.

**Change:** Ensure the SQFT input block is always visible, even when `dbSqftOptions` is null (no vehicle match). Add clearer labeling that you can type any number directly.

---

### Fix 3: Add Dimension Calculator for Trailers/Custom
**File:** `src/pages/MightyCustomer.tsx`
**Location:** After line 940 (after the SQFT input section)

**Add new UI section:**
```typescript
{/* Dimension Calculator for Trailers/Custom */}
<div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-dashed">
  <Label className="text-base font-semibold flex items-center gap-2">
    <Ruler className="h-4 w-4" />
    Dimension Calculator (Trailers, RVs, Custom)
  </Label>
  <div className="grid grid-cols-3 gap-3">
    <div className="space-y-1">
      <Label className="text-xs">Length (ft)</Label>
      <Input type="number" placeholder="14" value={dimLength} onChange={...} />
    </div>
    <div className="space-y-1">
      <Label className="text-xs">Height (ft)</Label>
      <Input type="number" placeholder="6" value={dimHeight} onChange={...} />
    </div>
    <div className="space-y-1">
      <Label className="text-xs"># of Sides</Label>
      <Input type="number" placeholder="2" min="1" max="4" value={dimSides} onChange={...} />
    </div>
  </div>
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => {
      const calculatedSqft = dimLength * dimHeight * dimSides;
      handleSqftChange(calculatedSqft);
    }}
  >
    Calculate: {dimLength * dimHeight * dimSides} sq ft
  </Button>
</div>
```

**Add state variables:**
```typescript
const [dimLength, setDimLength] = useState(0);
const [dimHeight, setDimHeight] = useState(0);
const [dimSides, setDimSides] = useState(2);
```

---

### Fix 4: Update "Email" Label to Show It's Optional for Save
**File:** `src/pages/MightyCustomer.tsx`
**Line:** 1087

**Change:**
```typescript
// Before:
<Label>Email</Label>

// After:
<Label>Email (required to send quote)</Label>
```

This makes it clear that email is only required for sending, not saving.

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `MightyCustomer.tsx` line 1134 | Remove `!customerData.name \|\| !customerData.email` from Save Quote disabled condition | Allow saving quotes without customer info |
| `MightyCustomer.tsx` lines 874-940 | Ensure SQFT input is always visible regardless of vehicle selection | Allow manual SQFT entry anytime |
| `MightyCustomer.tsx` after line 940 | Add Dimension Calculator UI (Length × Height × Sides) | Quick SQFT calculation for trailers/custom |
| `MightyCustomer.tsx` line 1087 | Update email label to "(required to send)" | Clarify when email is needed |

---

## Expected Result After Fix

1. **Save Quote** → Enabled as long as product is selected and total > 0
2. **Send Quote Email** → Enabled when product + total + name + email are filled
3. **SQFT Input** → Always visible, can type any number directly
4. **Dimension Calculator** → New section for trailers: enter Length × Height × Sides → auto-calculates SQFT
5. **Preview Email** → Remains as-is (only needs product + total)

