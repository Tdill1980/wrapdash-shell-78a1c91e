

# Remove Trade Secrets from Website Chat Header

## Summary
Replace the detailed 13-feature list in the LOCKED header with a simpler version that protects trade secrets while still marking the file as locked.

---

## Current Problem

The current header (lines 1-30) exposes trade secret information:
- Specific pricing logic details
- Bulk discount tier structure
- Feature implementation details
- Internal workflow information

---

## New Simplified Header

Replace lines 1-30 with a clean, non-revealing header:

```typescript
// =====================================================
// ⚠️⚠️⚠️ LOCKED - DO NOT MODIFY - FINAL V3.0 ⚠️⚠️⚠️
// =====================================================
// Last Updated: January 30, 2026
// VERSION: 3.0 - FINAL LOCKED PRODUCTION VERSION
// 
// AI PROVIDER: Lovable AI Gateway (google/gemini-3-flash-preview)
// ORG ID: 51aa96db-c06d-41ae-b3cb-25b045c75caf
//
// ⚠️ ANY MODIFICATION REQUIRES EXPLICIT APPROVAL ⚠️
// Contact: @jackson or @trish before ANY changes
// =====================================================
```

---

## Changes Summary

| Location | Action |
|----------|--------|
| Lines 1-30 | Replace with 12-line simplified header |
| End of file | Keep footer lock warning (no secrets there) |

**Removed from header:**
- All 13 feature bullet points
- Specific pricing mentions
- Discount structure references
- Workflow details

**Kept in header:**
- LOCKED status warning
- Version number (3.0)
- AI provider info
- Org ID
- Approval requirement

---

## Technical Details

### File to Modify
- `supabase/functions/website-chat/index.ts`

### No Logic Changes
Header-only update - all functionality remains intact.

