# 🚨 ARCHITECTURE BIBLE — READ THIS FIRST 🚨
## WrapCommandAI / WePrintWraps Infrastructure

**STOP. Before you do ANYTHING, read this entire document.**

---

## THE GOLDEN RULES

1. **ALL code lives on MY infrastructure** — NOT Lovable
2. **Lovable is ONLY for AI image generation** — nothing else
3. **DO NOT "clean up" or "fix" things I didn't ask for**
4. **When in doubt, ASK ME FIRST**

---

## MY INFRASTRUCTURE

### Frontend Deployment
| Component | Platform | URL |
|-----------|----------|-----|
| WrapCommandAI | Vercel | wrapcommandai.com |
| WePrintWraps Chat Widget | WordPress + Vercel | weprintwraps.com |

### Backend / Database
| Component | Platform | Project ID |
|-----------|----------|------------|
| Database | MY Supabase | `qxllysilzonrlyoaomce` |
| Edge Functions (160+) | MY Supabase | `qxllysilzonrlyoaomce` |
| Auth | MY Supabase | `qxllysilzonrlyoaomce` |

### Code Repository
| Repo | Platform |
|------|----------|
| [wrapdash-shell-78a1c91e](https://github.com/Tdill1980/wrapdash-shell-78a1c91e) | GitHub |
| wrapdash-shell (OLD) | ARCHIVED — do not use |

---

## DEPLOYMENT FLOW

```
Code Changes
     ↓
Push to GitHub
     ↓
┌─────────────────────────────────────┐
│         VERCEL (Auto-Deploy)        │
│   • Frontend React app              │
│   • Pages and components            │
│   • Static assets                   │
└─────────────────────────────────────┘
     
Edge Functions
     ↓
Deploy via Supabase CLI or Dashboard
     ↓
┌─────────────────────────────────────┐
│      MY SUPABASE (qxllysilz...)     │
│   • 160+ edge functions             │
│   • command-chat (AI kernel)        │
│   • cmd-* tools                     │
│   • All database tables             │
└─────────────────────────────────────┘
```

**THERE IS NO LOVABLE IN THIS FLOW.**

---

## ⚠️ LOVABLE — EXTREMELY LIMITED USE ⚠️

Lovable is ONLY used for **AI image generation API calls**.

### ONLY These Files Should Reference Lovable:
- `render-client.ts` — 3D render API calls
- `ApproveFlow.tsx` — 3D vehicle renders
- `DesignPanelPro.tsx` — 3D design renders
- `WBTY.tsx` — 3D renders
- `FadeWraps.tsx` — 3D renders

### Lovable Does NOT:
- ❌ Host my code
- ❌ Deploy my frontend
- ❌ Sync with my GitHub
- ❌ Run my edge functions
- ❌ Store my database
- ❌ Have a "Pull from GitHub" button for my project

### If You Suggest Lovable For:
- Deployment → **WRONG**
- Syncing code → **WRONG**
- Hosting → **WRONG**
- Database → **WRONG**
- Edge functions → **WRONG**

---

## COMMANDCHAT — AI OPERATING SYSTEM

CommandChat is my modular AI agent architecture.

### Architecture
```
Customer Message
       ↓
┌─────────────────────────────────────┐
│     command-chat (KERNEL)           │
│     ~120 lines — orchestrator       │
│     Uses Anthropic tool_use         │
└─────────────────────────────────────┘
       ↓
   AI decides which tools to call
       ↓
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│cmd-      │cmd-      │cmd-      │cmd-      │cmd-      │
│knowledge │vehicle   │pricing   │quote     │synopsis  │
│          │          │          │          │          │
│Products  │70+ cars  │$5.27/sqft│Save to DB│AI summary│
│FAQs      │Sqft data │Bulk disc │Email via │1-line    │
│URLs      │Fallbacks │Free ship │Resend    │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Deployed Functions (on MY Supabase)
| Function | Purpose |
|----------|---------|
| `command-chat` | Kernel/orchestrator |
| `cmd-knowledge` | Knowledge retrieval |
| `cmd-vehicle` | Vehicle sqft lookup |
| `cmd-pricing` | Price calculation |
| `cmd-quote` | Quote creation + EMAIL |
| `cmd-synopsis` | AI synopsis |

### CRITICAL: cmd-quote MUST Email
The `cmd-quote` function:
1. Saves quote to database
2. **Sends email via Resend API**
3. Returns `email_sent: true/false`

**DO NOT remove email functionality from cmd-quote.**

---

## SUPABASE CLIENTS

### production-client.ts — USE THIS
```typescript
// Connects to MY Supabase
const supabaseUrl = 'https://qxllysilzonrlyoaomce.supabase.co'
```
**Use for:** Everything except 3D renders

### render-client.ts — 3D RENDERS ONLY
```typescript
// Connects to Lovable for AI image generation
const lovable3DUrl = 'https://wzwqhfbmymrengjqikjl.supabase.co'
```
**Use for:** ApproveFlow, DesignPanelPro 3D renders ONLY

### client.ts — DO NOT USE
This is auto-generated by Lovable. Ignore it.

---

## ENVIRONMENT VARIABLES

### Required Secrets (in MY Supabase Edge Functions)
```
ANTHROPIC_API_KEY=sk-ant-...
EXTERNAL_SUPABASE_URL=https://qxllysilzonrlyoaomce.supabase.co
EXTERNAL_SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
```

### Frontend (.env)
```
VITE_SUPABASE_URL=https://qxllysilzonrlyoaomce.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**DO NOT point these to Lovable.**

---

## PROTECTED FILES — DO NOT MODIFY WITHOUT PERMISSION

- `src/integrations/supabase/production-client.ts`
- `src/integrations/supabase/render-client.ts`
- `public/embed/chat-widget.js`
- `public/embed/chat-bubble.js`
- `supabase/functions/command-chat/index.ts`
- `supabase/functions/cmd-quote/index.ts`

---

## BEFORE MAKING ANY CHANGES

### Ask Yourself:
1. Am I pointing anything to Lovable? → **STOP** (unless it's 3D renders)
2. Am I "cleaning up" something that wasn't requested? → **STOP**
3. Am I removing email functionality? → **STOP**
4. Am I changing Supabase URLs? → **STOP and verify**

### If You See a 404:
1. Check if route exists in React router
2. Check if component exists
3. Check Vercel deployment status
4. **DO NOT suggest "syncing with Lovable"**

### If Something Isn't Working:
1. Check edge function logs in MY Supabase
2. Check Vercel deployment logs
3. Check browser console
4. **DO NOT revert to Lovable**

---

## SUMMARY

| Question | Answer |
|----------|--------|
| Where does frontend deploy? | **Vercel** |
| Where are edge functions? | **MY Supabase (qxllysilz...)** |
| Where is the database? | **MY Supabase** |
| What is Lovable for? | **3D render API calls ONLY** |
| Does Lovable sync with GitHub? | **NO** |
| Does Lovable host my code? | **NO** |

---

## VIOLATIONS

If you violate this architecture:
- Features will break
- Email quotes will stop working
- Chat agent will fail
- I will have to spend hours fixing your mistakes

**Read this document. Follow this document. Ask if unsure.**

---

*Last Updated: February 2026*
*Owner: Trish Dill — WrapCommandAI / WePrintWraps*
