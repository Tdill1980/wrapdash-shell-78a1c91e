

# Complete Website Chat, Vapi & MightyCustomer Repair Plan

## Executive Summary

This plan addresses all the failures you've identified and adds the missing product knowledge (Fade Wraps, Wrap by the Yard, RestyleProAI suite) to create a locked, production-ready system.

---

## Part 1: Critical Infrastructure Fixes

### 1.1 Switch AI Provider from Anthropic to Lovable AI Gateway

**Problem**: The current `website-chat` function requires `ANTHROPIC_API_KEY` which is not configured. This causes the AI to fall back to a generic response.

**Fix**: Replace the Anthropic API call with the Lovable AI Gateway:

```text
FROM (lines 1436-1448):
  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    headers: { 'x-api-key': anthropicKey, ... }
  });

TO:
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      max_tokens: 600
    })
  });
```

### 1.2 Fix Organization ID Mismatch

**Problem**: Website chat uses legacy org ID `031ac427-f078-4086-a9bc-7bdb78cc1c73`, but admin inbox expects `51aa96db-c06d-41ae-b3cb-25b045c75caf`.

**Fix**: Update all org ID references in `website-chat/index.ts`:

| Line | Current | New |
|------|---------|-----|
| 601 | `031ac427-f078-4086-a9bc-7bdb78cc1c73` | `51aa96db-c06d-41ae-b3cb-25b045c75caf` |
| 918 | `031ac427-f078-4086-a9bc-7bdb78cc1c73` | `51aa96db-c06d-41ae-b3cb-25b045c75caf` |
| 1057 | `031ac427-f078-4086-a9bc-7bdb78cc1c73` | `51aa96db-c06d-41ae-b3cb-25b045c75caf` |
| 1161 | `031ac427-f078-4086-a9bc-7bdb78cc1c73` | `51aa96db-c06d-41ae-b3cb-25b045c75caf` |

### 1.3 Register Vapi Webhook in config.toml

**Problem**: `vapi-webhook` function exists but is NOT registered in `supabase/config.toml`, meaning it's never deployed.

**Fix**: Add to `supabase/config.toml`:

```toml
[functions.vapi-webhook]
verify_jwt = false
```

### 1.4 Fix Vapi Pricing (Currently Wrong)

**Problem**: `vapi-webhook/index.ts` uses wrong pricing:

```text
Line 122-123: const pricePerSqft = productType === "color_change" ? 9.5 : 12.5;
```

**Fix**: Update to WPW pricing:

```typescript
// Correct WPW pricing
const pricePerSqft = 5.27; // Avery MPI 1105 (default)
```

### 1.5 Fix Vapi Year Filter (Reversed Logic)

**Problem**: Vehicle lookup has reversed year filter:

```text
Line 105-106: .gte("year_end", year).lte("year_start", year)
```

**Fix**: Correct the filter:

```typescript
.lte("year_start", year).gte("year_end", year)
```

---

## Part 2: Quote Flow Improvements

### 2.1 Update Pricing Flow: Price First, Then Collect Info

**Current behavior**: System requires ALL 4 fields (name, email, phone, shop) BEFORE showing any price.

**New behavior per your request**: 
1. Give price immediately when vehicle/dimensions are provided
2. THEN ask for contact info: "I can also send you a quote - just need your email and name"
3. If email captured → immediately send quote email

**Implementation**: Update the context logic around lines 1094-1121 to:

```typescript
// If we have sqft, ALWAYS give price first
if (chatState.sqft) {
  const price = Math.round(chatState.sqft * pricePerSqft);
  
  contextNotes = `💰 GIVE PRICE IMMEDIATELY!
  
  Vehicle: ${chatState.vehicle || 'Custom dimensions'}
  SQFT: ${chatState.sqft}
  PRICE: $${price}
  
  SAY: "That's about ${chatState.sqft} sqft. At $5.27/sqft, that's **$${price}**! 🔥
  ${price >= 750 ? '✨ FREE shipping included!' : ''}
  
  I can also email you a formal quote - just need your name and email!"`;
  
  // If we already have email, send quote automatically
  if (chatState.customer_email) {
    // Trigger quote email immediately
  }
}
```

### 2.2 Dimension-Based Quoting for Panels/Cut Contour

**Current behavior**: AI doesn't reliably ask for dimensions for panels/cut vinyl.

**New behavior**: Add explicit detection and handling:

```typescript
const isPanelOrCutQuestion = /\b(panel|cut|contour|decal|lettering|logo|graphics|sticker)\b/i.test(msg);

if (isPanelOrCutQuestion && !chatState.dimensions) {
  contextNotes = `📐 PANEL/CUT VINYL - NEED DIMENSIONS!
  
  SAY: "For panels and cut vinyl, I price by square foot.
  
  What are the dimensions? (width x height in inches or feet)
  
  For example: '24 x 36 inches' or '4ft x 8ft'"`;
}
```

---

## Part 3: Add Missing Product Knowledge

### 3.1 Add Wrap By The Yard Knowledge

Add to `WPW_KNOWLEDGE.products` section:

```typescript
WRAP BY THE YARD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price: $95.50 per yard (60" wide)
Collections:
• Camo & Carbon: https://weprintwraps.com/our-products/camo-carbon-wrap-by-the-yard/
• Metal & Marble: https://weprintwraps.com/our-products/wrap-by-the-yard-metal-marble/
• Wicked & Wild: https://weprintwraps.com/our-products/wrap-by-the-yard-wicked-wild-wrap-prints/
• Bape Camo: https://weprintwraps.com/our-products/wrap-by-the-yard-bape-camo/
• Modern & Trippy: https://weprintwraps.com/our-products/wrap-by-the-yard-modern-trippy/

Yard options: 1, 5, 10, 25, 50 yards
```

### 3.2 Add Enhanced Fade Wrap Knowledge

Update Fade Wrap section (already exists but needs enhancement):

```typescript
FADE WRAPS (Pre-Designed Gradient Wraps):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pricing by vehicle side length:
• Small (up to 144"): $600
• Medium (up to 172"): $710
• Large (up to 200"): $825
• XL (up to 240"): $990

Add-ons:
• Hood: +$160
• Front Bumper: +$200
• Rear + Bumper: +$395
• Roof: +$160-330

Order: https://weprintwraps.com/our-products/pre-designed-fade-wraps/
```

### 3.3 Add RestyleProAI Suite Knowledge (NEW)

Add completely new knowledge section:

```typescript
RESTYLEPROAI VISUALIZER SUITE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RestylePro™ is our AI-powered vehicle wrap visualization platform.
Website: https://restyleproai.com

THE SUITE INCLUDES:

1️⃣ ColorPro™ - Color Change Visualizer
   • See ANY Avery or 3M color on ANY vehicle instantly
   • Accurate LAB color matching from real manufacturer swatches
   • Perfect for color-change wrap decisions
   
2️⃣ DesignPanelPro™ - Custom Design Generator
   • AI-generated wrap patterns and designs
   • Choose from categories: Carbon, Geometric, Racing, etc.
   • Generates print-ready panel artwork
   
3️⃣ PatternPro™ - Pattern Visualizer
   • Specialty finishes: Chrome, Brushed Metal, Carbon Fiber
   • See texture and reflectivity before ordering
   
4️⃣ ApprovePro™ - 3D Proof Generator
   • Turn any 2D design into hyper-realistic 3D vehicle renders
   • Generates PDF proofs for customer approval
   • Speeds up the approval process - close deals faster!
   
5️⃣ FadeWraps™ - Gradient Wrap Designer
   • Design custom fade/ombre wraps
   • Color-to-black, two-tone, diagonal fades
   • Vehicle-accurate gradient positioning

BUILT FOR:
• PPF shops
• Color change wrap specialists
• Print shops
• Wrap installers

WHEN TO MENTION RESTYLEPRO:
• Customer asks about color-change wraps → "Check out RestyleProAI.com to visualize any color on your vehicle!"
• Customer is unsure about design → "Our DesignPanelPro can generate custom patterns for you"
• Customer wants to see proof before buying → "ApprovePro creates 3D renders for customer approval"
• Customer asks about specialty films (chrome, color-shift) → "RestyleProAI.com lets you visualize specialty finishes"
```

---

## Part 4: Add "Ask Me About RestyleProAI" Button

### 4.1 Add Quick Action Detection

Add to the context detection logic:

```typescript
const isRestyleProQuestion = /\b(restyle|restylepro|colorpro|designpanel|patternpro|approvepro|visualize|visualizer|see.*color|preview.*wrap|3d.*proof)\b/i.test(msg);

if (isRestyleProQuestion) {
  contextNotes = `🎨 RESTYLEPRO AI QUESTION!

SAY: "RestylePro™ is our hyper-realistic vehicle wrap visualizer suite! 🚗✨

**The Suite Includes:**
• **ColorPro™** - See any Avery or 3M color on your vehicle instantly
• **DesignPanelPro™** - AI-generated custom wrap patterns
• **PatternPro™** - Specialty finishes (chrome, brushed metal, carbon fiber)
• **ApprovePro™** - Turn 2D designs into 3D proofs for faster customer approval
• **FadeWraps™** - Design gradient/ombre wraps

👉 **Try it free:** https://restyleproai.com

It's built for wrap shops, PPF installers, and color-change specialists. Want me to explain how any of these work?"`;
}
```

### 4.2 Widget Quick Actions (Optional Enhancement)

Could add a "RestyleProAI" chip/button to the chat widget that triggers this response automatically.

---

## Part 5: Window Graphics Clarification (Already Started, Needs Enhancement)

Update the window question handler to be more explicit:

```typescript
if (isWindowQuestion && !chatState.window_type_clarified) {
  contextNotes = `🪟 WINDOW GRAPHICS QUESTION!

SAY: "Yes, we print window graphics! 🎨 We have two options:

1️⃣ **Perforated Window Vinyl (Window Perf)** - $5.32/sqft
   ✅ See-through from inside
   ✅ Graphics visible outside
   ✅ Perfect for rear windows, storefronts
   👉 Order: https://weprintwraps.com/our-products/perforated-window-vinyl-5050-unlaminated/

2️⃣ **Cut Vinyl Graphics** - $6.32/sqft (Avery) or $6.92/sqft (3M)
   ⚠️ Solid vinyl - NOT see-through
   ✅ Perfect for lettering, logos, decals
   👉 Order: https://weprintwraps.com/our-products/avery-cut-contour-vinyl-graphics-54-roll-max-artwork-size-50/

Which are you looking for? If you give me dimensions, I can get you an instant price!"`;
  
  chatState.window_type_clarified = true;
}
```

---

## Part 6: Vapi Webhook End-of-Call Enhancement

Add phone_calls record creation and SMS alert:

```typescript
case "end-of-call-report": {
  const callId = body.call?.id;
  const customerNumber = body.call?.customer?.number;
  const transcript = body.transcript || body.call?.transcript || '';
  const summary = body.summary || '';
  
  // Insert into phone_calls table
  await supabase.from('phone_calls').insert({
    vapi_call_id: callId,
    caller_phone: customerNumber,
    organization_id: WPW_ORG_ID,
    transcript: transcript,
    summary: summary,
    status: 'completed',
    source: 'vapi'
  });
  
  // Create escalation if hot lead
  if (summary.toLowerCase().includes('quote') || 
      summary.toLowerCase().includes('fleet') ||
      summary.toLowerCase().includes('wrap')) {
    await supabase.from('ai_actions').insert({
      action_type: 'send_sms_alert',
      status: 'pending',
      organization_id: WPW_ORG_ID,
      action_payload: {
        phone: '+14807726003', // Jackson
        message: `📞 Phone lead: ${customerNumber}\n${summary.substring(0, 100)}`
      }
    });
  }
  
  return new Response(JSON.stringify({ success: true }), { ... });
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add `[functions.vapi-webhook] verify_jwt = false` |
| `supabase/functions/website-chat/index.ts` | Switch to Lovable AI, fix org ID, add RestylePro knowledge, update pricing flow |
| `supabase/functions/vapi-webhook/index.ts` | Fix pricing ($5.27), fix year filter, add phone_calls insert |

---

## Locked Configuration Summary

| Setting | Locked Value |
|---------|--------------|
| **WPW Org ID** | `51aa96db-c06d-41ae-b3cb-25b045c75caf` |
| **AI Provider** | Lovable AI Gateway (`google/gemini-3-flash-preview`) |
| **Avery MPI 1105** | $5.27/sqft |
| **3M IJ180Cv3** | $5.27/sqft (price drop!) |
| **Window Perf** | $5.32/sqft |
| **Cut Vinyl (Avery)** | $6.32/sqft |
| **Cut Vinyl (3M)** | $6.92/sqft |
| **Wrap By The Yard** | $95.50/yard |
| **Fade Wraps** | $600-$990 by size |
| **Custom Design** | $750 |
| **Quote Flow** | Price FIRST, then collect email |

---

## Testing Checklist

After implementation, verify:

1. **Website Chat AI responds correctly**
   - Test: "Do you print window graphics?"
   - Expected: Lists both options with prices and URLs

2. **Price given immediately**
   - Test: "How much for a 2024 F-150?"
   - Expected: "$1,470" shown before asking for email

3. **RestyleProAI explained**
   - Test: "What is RestylePro?"
   - Expected: Full suite explanation with URL

4. **Admin inbox shows conversations**
   - Test: Send message via widget
   - Expected: Appears in `/website-admin` immediately

5. **Vapi webhook works**
   - Test: Configure Vapi dashboard, make test call
   - Expected: `phone_calls` record created with transcript

---

## Vapi Dashboard Configuration (Your Action Required)

After deployment, set:

**Webhook URL:**
```
https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/vapi-webhook
```

**Tool Definitions:** (JSON provided in previous responses)

