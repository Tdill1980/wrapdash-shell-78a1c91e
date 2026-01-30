# WrapCommand Integration Guide

## Overview

This document provides the integration details for connecting WrapCommand SaaS to the WePrintWraps.com quote database. Both applications share the same Supabase instance, allowing real-time access to quote data without migration.

**Important:** This integration is READ-focused. WrapCommand displays the same Lead Management UI as the Quote Tool admin without modifying the Quote Tool codebase.

---

## Database Connection

### External Quote Database (Legacy Jackson Quote Tool)

| Property | Value |
|----------|-------|
| Project ID | `lqxnwskrrshythrydzcs` |
| Project URL | `https://lqxnwskrrshythrydzcs.supabase.co` |
| Tenant ID | `wpw` (WePrintWraps) |

### Tenant Identification

All quotes from this external database belong to the `wpw` tenant. When syncing or displaying, use:

```typescript
const EXTERNAL_TENANT = {
  id: 'wpw',
  name: 'WePrintWraps',
  supabaseUrl: 'https://lqxnwskrrshythrydzcs.supabase.co',
  storePrefix: '33' // WooCommerce order numbers starting with 33xxx
};
```

---

## Quotes Table Schema

The `quotes` table contains all lead and order data from WePrintWraps.com.

### Core Fields

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `quote_number` | text | Format: `WPW-YYMMDD-XXXX` |
| `customer_name` | text | Customer's full name |
| `email` | text | Customer email (required) |
| `phone` | text | Phone number |
| `created_at` | timestamp | Quote submission date |
| `updated_at` | timestamp | Last update timestamp |

### Quote Details

| Column | Type | Description |
|--------|------|-------------|
| `vehicle` | text | Vehicle year/make/model |
| `category` | text | `car-truck`, `trailer`, `boat`, `fleet`, `signs`, `walls`, `windows`, `appliances`, `other` |
| `material` | text | Wrap material type |
| `sqft` | numeric | Square footage |
| `coverage` | text | `full` or partial coverage |
| `wrap_type` | text | Type of wrap |
| `roof_option` | text | `with-roof` or `no-roof` |

### Pricing

| Column | Type | Description |
|--------|------|-------------|
| `final_price` | numeric | Final quoted price |
| `estimated_price` | numeric | System-calculated estimate |
| `price_before_discount` | numeric | Pre-discount price |
| `discount_percent` | numeric | Discount percentage |
| `discount_amount` | numeric | Discount dollar amount |

### Lead Status

| Column | Type | Description |
|--------|------|-------------|
| `status` | text | `pending`, `email_sent`, `call_back_later`, `quoted_manually`, `contacted`, `checkout_started` |
| `source` | text | Lead source identifier |
| `intent` | text | `standard_quote`, `needs_review` |
| `callback_date` | timestamp | Scheduled callback date |
| `status_changed_at` | timestamp | When status last changed |
| `phone_contacted_at` | timestamp | When customer was called |
| `sms_sent_at` | timestamp | When SMS was sent |
| `sms_count` | integer | Number of SMS messages sent |

### Review Fields

| Column | Type | Description |
|--------|------|-------------|
| `needs_review` | boolean | Requires manual review |
| `review_status` | text | `pending` or `completed` |
| `reviewed_at` | timestamp | When review was completed |
| `notes` | text | Internal notes |

### Design Service

| Column | Type | Description |
|--------|------|-------------|
| `design_service` | text | Design service type |
| `design_notes` | text | Design-specific notes |
| `art_file_urls` | text[] | Array of uploaded art file URLs |
| `branding_file_urls` | text[] | Array of branding file URLs |
| `breakdown_data` | jsonb | Detailed breakdown (fleet vehicles, panels, etc.) |

### WooCommerce Integration

| Column | Type | Description |
|--------|------|-------------|
| `woo_order_id` | integer | WooCommerce order ID |
| `woo_order_number` | text | Order number (33xxx = WPW store) |
| `woo_order_status` | text | Order status |
| `woo_order_total` | numeric | Order total |
| `woo_order_date` | timestamp | Order date |
| `woo_order_items` | jsonb | Array of order items |
| `woo_billing_name` | text | Billing name from WooCommerce |
| `woo_billing_email` | text | Billing email |
| `match_type` | text | `quote_number`, `email`, or `name` |
| `converted_at` | timestamp | When order was converted |

### UTM Tracking

| Column | Type | Description |
|--------|------|-------------|
| `utm_source` | text | UTM source |
| `utm_medium` | text | UTM medium |
| `utm_campaign` | text | UTM campaign |
| `utm_content` | text | UTM content |

---

## Source Mapping

Map database `source` values to display labels:

```typescript
export const SOURCE_MAPPING: Record<string, string> = {
  // Quote Tool sources
  "wpw_home_quote_tool": "quote_tool",
  "wpw_quote_page": "quote_tool",
  "jackson_quote_tool": "quote_tool",
  
  // Chat widget sources
  "chat_widget": "website_chat",
  "website_chat": "website_chat",
  "website": "website_chat",
  
  // Voice AI sources
  "vapi_voice": "phone",
  "vapi_phone": "phone",
  "phone": "phone",
  
  // Email sources
  "email": "email",
  "manual": "manual",
};

export const SOURCE_LABELS: Record<string, string> = {
  "all": "All Sources",
  "quote_tool": "Quote Tool",
  "website_chat": "Website Chat",
  "phone": "Phone/Vapi",
  "email": "Email",
  "manual": "Manual",
};

export const SOURCE_ICONS: Record<string, string> = {
  "quote_tool": "📊",
  "website_chat": "💬",
  "phone": "📞",
  "email": "📧",
  "manual": "✏️",
};
```

---

## Lead Tab Filtering Logic

### New Leads
```typescript
const isNewLead = (q) => 
  !q.status || 
  q.status === "pending" || 
  q.status === "needs_review" ||
  q.status === "checkout_started" ||
  (q.needs_review === true && q.review_status === "pending");
```

### Email Sent
```typescript
const emailSentLeads = quotes.filter(q => q.status === "email_sent");
```

### Call Back Later
```typescript
const callBackLeads = quotes.filter(q => q.status === "call_back_later")
  .sort((a, b) => new Date(a.callback_date) - new Date(b.callback_date));
```

### Completed
```typescript
const completedLeads = quotes.filter(q => 
  q.status === "quoted_manually" || 
  q.status === "contacted" ||
  (q.needs_review === true && q.review_status === "completed") ||
  q.woo_order_status === "processing" ||
  q.woo_order_status === "completed"
);
```

### Converted (Paid Orders)
```typescript
const UNPAID_ORDER_STATUSES = ['pending', 'on-hold', 'failed', 'cancelled', 'none'];

const convertedOrders = quotes.filter(q => 
  q.woo_order_id !== null &&
  q.woo_order_number?.startsWith('33') &&  // WPW store prefix
  !UNPAID_ORDER_STATUSES.includes(q.woo_order_status || 'none')
);
```

**Important:** For the Converted tab, sort by `woo_order_date` (order date), not `created_at` (quote date).

---

## Match Type Badges

Display confidence badges for WooCommerce order matching:

| Match Type | Color | Label |
|------------|-------|-------|
| `quote_number` | Green (`bg-green-600`) | "Quote #" |
| `email` | Blue (`bg-blue-600`) | "Email" |
| `name` | Amber (`bg-amber-100 text-amber-800`) | "Name" |

---

## Status Update Webhook

When WrapCommand updates a quote status, send a webhook to sync the change:

### Webhook Endpoint
```
POST https://lqxnwskrrshythrydzcs.supabase.co/functions/v1/quote-status-webhook
```

### Payload
```typescript
interface QuoteStatusUpdate {
  quote_id: string;
  quote_number: string;
  new_status: string;
  previous_status?: string;
  updated_by: string;
  updated_at: string;
  tenant_id: string; // 'wpw'
  notes?: string;
  callback_date?: string;
}
```

### Headers
```
Content-Type: application/json
x-wpw-embed-secret: [WPW_EMBED_SECRET]
```

---

## Edge Function: fetch-external-quotes

This edge function fetches quotes from the external WPW database:

```typescript
// Use via: supabase.functions.invoke('fetch-external-quotes', { body: { source: 'quote_tool' } })
```

### Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | string | `'all'` | Filter by source category |
| `status` | string | - | Filter by status |
| `limit` | number | `500` | Max records to return |
| `offset` | number | `0` | Pagination offset |
| `orderBy` | string | `'created_at'` | Sort column |
| `ascending` | boolean | `false` | Sort direction |

---

## Security Notes

1. **RLS Policy:** The external `quotes` table has Row Level Security. All reads go through edge functions using service role.

2. **Service Role Key:** Stored as `EXTERNAL_QUOTE_DB_SERVICE_KEY` secret.

3. **Embed Secret:** Status updates require `x-wpw-embed-secret` header for validation.

4. **Read-Only Default:** WrapCommand should primarily READ. Any writes go through dedicated webhooks.

---

## Contact

For questions about this integration, reference the WrapCommandAI architecture documentation.
