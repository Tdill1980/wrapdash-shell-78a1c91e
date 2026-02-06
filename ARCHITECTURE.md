# ARCHITECTURE - Supabase Configuration

## ⚠️ WARNING: DO NOT CHANGE WITHOUT APPROVAL ⚠️

This document defines the critical Supabase architecture. Any changes require explicit approval from @jackson or @trish.

---

## Two Supabase Instances

### 1. YOUR Supabase - WePrintWraps Production
- **Project ID:** `qxllysilzonrlyoaomce`
- **URL:** `https://qxllysilzonrlyoaomce.supabase.co`
- **Purpose:** ALL business data and edge functions
- **Used for:**
  - ✅ Database operations (quotes, orders, customers, conversations)
  - ✅ ALL edge functions (160+ functions)
  - ✅ Storage (media-library, shopflow-files)
  - ✅ Authentication
  - ✅ Real-time subscriptions

### 2. Lovable's Supabase - 3D RENDERS ONLY
- **Project ID:** `wzwqhfbmymrengjqikjl`
- **URL:** `https://wzwqhfbmymrengjqikjl.supabase.co`
- **Purpose:** AI image generation (3D renders only)
- **Used for:**
  - ✅ `generate-color-render` (DesignPanelPro)
  - ✅ `generate-studio-renders` (ApproveFlow)
  - ✅ `generate-3d` / `generate-3dproof`
  - ✅ `generate-master` / `generate-panel`
  - ✅ `analyze-vinyl-swatch`
  - ❌ NOT for any other edge functions
  - ❌ NOT for database operations
  - ❌ NOT for storage

---

## Code Structure

### Client Files

| File | Purpose |
|------|---------|
| `src/integrations/supabase/client.ts` | Main Supabase clients |
| `src/integrations/supabase/production-client.ts` | Explicit WPW client |

### Client Exports

```typescript
// From client.ts:
export const supabase;           // Database → WPW
export const lovableFunctions;   // Edge functions → WPW (despite name!)
export const lovable3DRenders;   // 3D renders ONLY → Lovable
export const WPW_FUNCTIONS_URL;  // 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1'
```

---

## Files Allowed to Use Lovable

The following files have the warning comment `// ⚠️ LOVABLE CONNECTION - FOR 3D RENDERS ONLY`:

1. `src/modules/designproai/pages/DesignPanelPro.tsx`
2. `src/modules/designproai/pages/WBTY.tsx`
3. `src/modules/designproai/pages/FadeWraps.tsx`
4. `src/modules/designproai/hooks/useRenderPolling.ts`
5. `src/modules/designproai/lib/color-extractor.ts`
6. `src/modules/designpanelpro-enterprise/api.ts`
7. `src/modules/designpanelpro-enterprise/generator-api.ts`
8. `src/pages/ApproveFlow.tsx` (only for 3D render sections)

---

## Common Mistakes to Avoid

### ❌ WRONG: Using Lovable for edge functions
```typescript
// DON'T DO THIS
const response = await fetch('https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/my-function');
```

### ✅ CORRECT: Use WPW for edge functions
```typescript
// DO THIS
import { lovableFunctions } from "@/integrations/supabase/client";
const { data, error } = await lovableFunctions.functions.invoke('my-function', { body: {...} });

// OR
import { WPW_FUNCTIONS_URL } from "@/integrations/supabase/client";
const response = await fetch(`${WPW_FUNCTIONS_URL}/my-function`);
```

### ✅ CORRECT: Use lovable3DRenders for 3D only
```typescript
// For 3D renders ONLY
import { lovable3DRenders } from "@/integrations/supabase/client";
const { data, error } = await lovable3DRenders.functions.invoke('generate-color-render', { body: {...} });
```

---

## Environment Variables

```bash
# YOUR Supabase - WePrintWraps
VITE_SUPABASE_PROJECT_ID="qxllysilzonrlyoaomce"
VITE_SUPABASE_URL="https://qxllysilzonrlyoaomce.supabase.co"

# Lovable - 3D RENDERS ONLY
VITE_LOVABLE_FUNCTIONS_URL="https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1"
```

---

## Audit Checklist

When reviewing code, verify:

- [ ] No hardcoded `wzwqhfbmymrengjqikjl` URLs except in 3D render files
- [ ] `lovableFunctions` points to WPW in client.ts
- [ ] Only 3D render files use `lovable3DRenders` or Lovable URLs
- [ ] `.env` has WPW as the primary VITE_SUPABASE_* values
- [ ] New edge function calls use `lovableFunctions` or `callEdgeFunction`

---

## Last Updated
- **Date:** February 6, 2026
- **By:** Architecture Audit
- **Changes:** Fixed 90+ files incorrectly pointing to Lovable
