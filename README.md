# WrapCommandAI

Dashboard and AI command center for WePrintWraps.

## 🚨 READ FIRST

**Before making ANY changes, read `ARCHITECTURE-BIBLE.md`**

---

## Infrastructure

### GitHub
- **Repo:** https://github.com/Tdill1980/wrapdash-shell-78a1c91e
- **Old `wrapdash-shell` is ARCHIVED** — do not use

### Vercel (Frontend)
- **Project:** wrapdash-shell-78a1c91e
- **Preview URL:** https://wrapdash-shell-78a1c91e.vercel.app
- **Production:** https://wrapcommandai.com
- **Auto-deploys from:** GitHub main branch

### Supabase — ALL Data & Edge Functions
- **Project ID:** `qxllysilzonrlyoaomce`
- **URL:** https://qxllysilzonrlyoaomce.supabase.co
- **Edge Functions:** https://qxllysilzonrlyoaomce.supabase.co/functions/v1/
- **Contains:**
  - 160+ edge functions
  - command-chat (AI kernel)
  - All database tables (quotes, contacts, conversations, orders, vehicles)
  - Storage (media-library, shopflow-files)
  - Authentication

### Lovable — 3D RENDERS ONLY
- **Project ID:** `wzwqhfbmymrengjqikjl`
- **URL:** https://wzwqhfbmymrengjqikjl.supabase.co
- **Used ONLY for:** ApproveFlow renders, DesignPanelPro renders
- **NOT used for:** Chat, quotes, data, edge functions, anything else

---

## Websites

| Site | URL | Purpose |
|------|-----|---------|
| WePrintWraps | https://weprintwraps.com | Main store with chat widget |
| WrapCommandAI | https://wrapcommandai.com | Dashboard |

---

## Deployment Flow

```
Code Changes
     ↓
Push to GitHub (wrapdash-shell-78a1c91e)
     ↓
Vercel auto-deploys frontend
     ↓
https://wrapcommandai.com

Edge Functions
     ↓
Supabase CLI or Dashboard
     ↓
https://qxllysilzonrlyoaomce.supabase.co/functions/v1/
```

**Lovable has NO role in deployment.**

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase Edge Functions (Deno)
- **AI:** Anthropic Claude (tool_use)
- **Database:** PostgreSQL (Supabase)

---

## Key Documentation

| File | Purpose |
|------|---------|
| `ARCHITECTURE-BIBLE.md` | Complete architecture guide — READ THIS |
| `ARCHITECTURE.md` | Supabase configuration details |
| `PROTECTED.md` | Critical settings quick reference |

---

## Owner

**Trish Dill** — WrapCommandAI / WePrintWraps

*Last Updated: February 2026*
