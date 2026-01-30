

# Plan: Complete External Quote Database Integration

## Problem Summary

The `fetch-external-quotes` and `quote-status-webhook` edge functions are ready, but the **`EXTERNAL_QUOTE_DB_SERVICE_KEY` secret is missing**. This key is required to authenticate against the external Quote Tool database (`lqxnwskrrshythrydzcs`) using the service role (bypassing user auth).

---

## Architecture Clarification

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         WRAPCOMMAND PROJECT                             │
│                      (wzwqhfbmymrengjqikjl)                             │
│                                                                         │
│  ┌─────────────┐     ┌───────────────────────────────────────┐         │
│  │ Admin User  │────▶│ Auth against WrapCommand DB           │  ✅     │
│  │ (Jackson)   │     │ (Your Lovable Cloud)                  │         │
│  └─────────────┘     └───────────────────────────────────────┘         │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Edge Function: fetch-external-quotes                            │   │
│  │ Uses: EXTERNAL_QUOTE_DB_SERVICE_KEY (service role)              │   │
│  │ Status: ⚠️ KEY NOT CONFIGURED                                   │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                                  ▼ (Service Role - No User Auth Required)
┌─────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL QUOTE TOOL PROJECT                         │
│                      (lqxnwskrrshythrydzcs)                            │
│                      (Separate Lovable Cloud)                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ quotes table                                                    │   │
│  │ - 218+ quotes from WePrintWraps.com                            │   │
│  │ - $21K+ revenue data                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Auth Settings: ❌ You don't have access to configure                  │
│  (But we don't need user auth - service role bypasses it)              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Required Action

### Step 1: Get the Service Role Key

Contact the owner of the Quote Tool Lovable project and ask them to:

1. Open their Lovable project
2. Click **Cloud** (backend button)
3. Go to **Settings** or **API Keys**
4. Copy the **Service Role Key** (NOT the anon key)
5. Share it with you securely (Signal, encrypted email, etc.)

### Step 2: Add the Secret to WrapCommand

Once you have the key, add it as a secret:
- **Secret Name**: `EXTERNAL_QUOTE_DB_SERVICE_KEY`
- **Value**: The service role key from the Quote Tool project

### Step 3: Test the Integration

After adding the secret, test the edge function:
```
POST /fetch-external-quotes
Body: { "limit": 10 }
```

Expected response:
```json
{
  "success": true,
  "tenant_id": "wpw",
  "quotes": [...],
  "count": 218,
  "analytics": {
    "total": 218,
    "converted_count": 17,
    "converted_revenue": 21456
  }
}
```

---

## Alternative: Self-Owned Database

If the Quote Tool is **your own** project on a different Lovable account, you have two options:

### Option A: Get the Key from Your Other Account
1. Log into the Lovable account that owns the Quote Tool
2. Open the Cloud dashboard for that project
3. Find the service role key
4. Add it to this project as `EXTERNAL_QUOTE_DB_SERVICE_KEY`

### Option B: Migrate Data to WrapCommand
If you can't access the service key, we could:
1. Export the quotes data from the external project
2. Import it into your WrapCommand database
3. Update the Quote Tool to write to WrapCommand instead

This would eliminate the external database dependency entirely.

---

## Files Already Created (Ready to Use)

| File | Purpose | Status |
|------|---------|--------|
| `supabase/functions/fetch-external-quotes/index.ts` | Read quotes from external DB | ✅ Ready |
| `supabase/functions/quote-status-webhook/index.ts` | Update quote status on external DB | ✅ Ready |
| `.lovable/wrapcommand-integration-guide.md` | Documentation for schema/integration | ✅ Ready |

---

## Summary

The "requested path is invalid" error is from the **other** Lovable project's auth settings - but you don't need to fix it. The edge functions use the **service role key** which bypasses user authentication entirely.

**Next step**: Get the `EXTERNAL_QUOTE_DB_SERVICE_KEY` from whoever owns the Quote Tool project and add it as a secret here.

