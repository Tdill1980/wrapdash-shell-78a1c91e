
# Fix Jordan's Wrong Installation Answer - CRITICAL

## The Problem
Jordan told a customer that WePrintWraps offers installation services. **THIS IS FALSE.**

WePrintWraps is a **PRINT SHOP ONLY**:
- We PRINT vehicle wraps
- We SHIP them nationwide  
- We do NOT install - customers arrange local installation

## Root Cause Analysis

The `wpw-knowledge-base.ts` has the correct info buried at line 144-152:
```
WHAT WPW DOES NOT DO:
- Installation (all installs done by third-party shops)
```

**BUT** Jordan's system prompt in `website-chat/index.ts` (line 127+) does NOT have this as a **CRITICAL FIRST RULE**. It's mixed in with other info and the AI model isn't treating it as non-negotiable.

## The Fix

### 1. Add CRITICAL IDENTITY RULE to Jordan's System Prompt

Location: `supabase/functions/website-chat/index.ts` - `buildJordanPersona()` function (line 127)

Insert at the VERY TOP of the persona string, BEFORE personality:

```typescript
return `
⚠️ CRITICAL IDENTITY RULE - NEVER VIOLATE:

WePrintWraps is a PRINT SHOP ONLY. We print and ship vehicle wraps.

WE DO NOT INSTALL WRAPS. We have NO installation team. We do NOT go to customer locations.

If asked about installation, say EXACTLY: "No, we're a print shop - we print and ship. You'll need a local installer. I can help you find one in your area if you need!"

NEVER claim we offer installation services. This is non-negotiable.

---

You are "Jordan" — a friendly woman who works at WePrintWraps.
...
```

### 2. Add "NEVER SAY" Section to Jordan's Rules

Add explicit "NEVER SAY" rules alongside the existing rules:

```
🚫 WHAT JORDAN MUST NEVER SAY:
- "We offer installation" (FALSE - we only print and ship)
- "Our installation team" (FALSE - we have no installers)
- "We can install" (FALSE)
- "We'll come to you" (FALSE - we ship only)
- Any promise of installation services
```

### 3. Update Knowledge Base with Higher Priority

Update `supabase/functions/_shared/wpw-knowledge-base.ts` - Add new entry with priority 200 (highest):

```typescript
export const WPW_IDENTITY: KnowledgeEntry = {
  category: "identity",
  title: "WPW Core Identity - Print Shop Only",
  appliesTo: ["alex_morgan", "jordan_lee", "grant_miller", "taylor_brooks", "casey_ramirez", "evan_porter"],
  keywords: ["install", "installation", "installer", "come to", "visit", "location", "in person", "service"],
  priority: 200, // HIGHEST PRIORITY
  content: `
⚠️ CRITICAL - NON-NEGOTIABLE:

WePrintWraps is a PRINT SHOP ONLY.

WHAT WE DO:
- Print vehicle wrap graphics
- Ship nationwide via UPS/FedEx
- Provide design services

WHAT WE DO NOT DO:
- Installation (we do NOT install wraps)
- Local pickup (ship only)
- On-site visits
- Any in-person services

IF ASKED ABOUT INSTALLATION:
Say: "No, we're a print shop - we print and ship. You'll need a local installer. I can help you find one in your area!"

Never say "we install" or "our installation team" - these are FALSE statements.
`,
};
```

### 4. Add Installation Detection Pattern

Add to website-chat to detect installation questions and handle them correctly:

```typescript
const INSTALLATION_PATTERNS = /\b(install|installation|installer|put on|apply|wrap my|wrap the|come to|visit|location|in person|service area|mobile)\b/i;

// In message handling, check for installation questions
if (INSTALLATION_PATTERNS.test(message_text)) {
  // Force correct response about print-only
  console.log('[JordanLee] Installation question detected - enforcing print-only messaging');
}
```

### 5. Redeploy Edge Function

After updating the code:
- Deploy `website-chat` edge function
- Test with: "Do you offer installation?"
- Expected response: "No, we're a print shop - we print and ship. You'll need a local installer..."

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/website-chat/index.ts` | Add CRITICAL IDENTITY RULE at top of Jordan's persona |
| `supabase/functions/_shared/wpw-knowledge-base.ts` | Add WPW_IDENTITY entry with priority 200 |

## Test After Deployment

Questions to test:
1. "Do you offer installation?"
2. "Can you install the wrap for me?"
3. "Do you have installers near me?"
4. "Will someone come put this on my car?"

Expected answer pattern:
"No, we're a print shop - we print and ship. You'll need a local installer. I can help you find one in your area!"

## Also Update Alex (Phone Agent)

The uploaded `vapi-alex-system-prompt.md` already has correct language at line 10:
> "We PRINT vehicle wraps and SHIP them nationwide. We do NOT install - customers arrange local installation."

And line 96:
> "Never say we do installation (we only print and ship)"

This is correct. Jordan needs the same treatment.
