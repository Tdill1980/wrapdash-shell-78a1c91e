
# Deploy Chat Widget + Fix Jordan AI Pricing + Design Team Alerts

## Current Situation Analysis

| Component | Status |
|-----------|--------|
| `public/embed/chat-widget.js` | ✅ Dark UI, file upload, Check My File - but NOT deployed to Supabase storage |
| `website-chat` edge function | ✅ Already defaults to **NO ROOF** pricing (`sqft: data.noRoof`) |
| `check-artwork-file` function | ⚠️ Sends email but no escalation alert if AI can't verify print-ready |
| WordPress embed | ❌ Loading old cached widget - needs fresh deploy |

---

## Pricing Rule Confirmation

The current `website-chat/index.ts` **ALREADY quotes MINUS ROOF by default**:

```typescript
// Line 392 in findVehicleSqft()
return { 
  sqft: data.noRoof,       // ← THIS is the default quote
  sqftWithRoof: data.total, 
  ...
};
```

**Example**: F-150 shows `279 sqft` (no roof) not `312 sqft` (with roof)

The AI prompt at line 1190-1195 says:
```
Vehicle: ${vehicleDisplay}
SQFT: ${chatState.sqft} (no roof)    ← Already labeled "no roof"
PRICE: $${price}
```

**NO CODE CHANGE NEEDED** for the minus-roof default. ✅

---

## Changes Required

### 1. Deploy Chat Widget to Supabase Storage

**Action**: Upload `public/embed/chat-widget.js` to the `shopflow-files` storage bucket

This fixes WordPress loading the old design. The embed URL stays the same:
```
https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/shopflow-files/chat-widget.js
```

### 2. Apply Jordan AI Fix from Uploaded Files

**File**: `supabase/functions/website-chat/index.ts`

Add the explicit installation blocking from `website-chat-index_8.ts`:

| Change | Why |
|--------|-----|
| Add `INSTALL_KEYWORDS` array | Catch more installation-related phrases |
| Add response safety filter | Block any AI response that accidentally claims installation |
| Strengthen persona prompt | Add explicit "NEVER SAY" list |

The uploaded file already has these fixes - merge them into the current production function.

### 3. Add Design Team Escalation for Low AI Scores

**File**: `supabase/functions/check-artwork-file/index.ts`

When AI file score is below 6 OR has critical issues, create an escalation alert:

```typescript
// After line 206 (after creating the ai_action record)
if (assessment.score < 6 || !assessment.fileTypeOk) {
  // Create urgent design alert
  await supabase.from('ai_actions').insert({
    action_type: 'design_team_alert',
    priority: 'urgent',
    status: 'pending',
    resolved: false,
    action_payload: {
      alert_type: 'file_check_uncertain',
      file_name,
      file_url,
      ai_score: assessment.score,
      issues: assessment.quickIssues,
      customer_email: customer_email || null,
      recipients: ['lance@weprintwraps.com'],
      cc: ['trish@weprintwraps.com', 'brice@weprintwraps.com'],
      message: `AI unable to verify print-readiness (score ${assessment.score}/10)`
    },
    preview: `⚠️ DESIGN ALERT: ${file_name} - AI score ${assessment.score}/10 - needs human review`
  });
}
```

---

## Uploaded Files Analysis

### `wpw_product_urls-2.pdf`
Product catalog with URLs - useful for knowledge base. Contains:
- Wall Wrap, Custom Design, Design Setup, Fade Wraps
- Avery 1105, 3M IJ180, Cut Contour vinyl
- Window Perf, Wrap by the Yard options

### `List_Export_2026-01-29_4.csv`
Contact list export (451 contacts) - appears to be Klaviyo/email list export. Not needed for chat widget deployment.

---

## File Changes Summary

| File | Action |
|------|--------|
| `public/embed/chat-widget.js` → Supabase Storage | Deploy to `shopflow-files` bucket |
| `supabase/functions/website-chat/index.ts` | Add installation keyword blocking from uploaded fix |
| `supabase/functions/check-artwork-file/index.ts` | Add design team escalation for low AI scores |

---

## Post-Deployment Verification

1. **Test WordPress Embed**: Visit weprintwraps.com → chat bubble should show dark UI
2. **Test Installation Question**: Ask "Do you install?" → Jordan MUST say "No, we're a print shop"
3. **Test File Upload**: Upload a file → design team should receive email notification
4. **Test Pricing**: Ask about F-150 → should quote ~$1,470 (279 sqft × $5.27) - NO ROOF

---

## WordPress Embed Code (Unchanged)

```html
<script
  defer
  src="https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/shopflow-files/chat-widget.js"
  data-org="wpw"
  data-agent="jordan"
  data-mode="live">
</script>
```
