
# Quote-to-Order Workflow: Payment-Gated Order Creation with Auto Artwork Requests

## Overview

This implementation adds a complete quote-to-order workflow where:
1. **Order numbers are ONLY generated when marked as paid** (not on quote creation)
2. **ShopFlow orders auto-create when payment confirmed**
3. **ApproveFlow projects auto-create when design products are included**
4. **Auto-trigger artwork request emails** if no files are attached

**Critical Constraint**: All changes must preserve WePrintWraps.com WooCommerce webhook functionality.

---

## Current System Analysis

### How It Works Now (WooCommerce Orders)
- `sync-wc-shopflow` already has a **PAID GATE** (lines 6-32) that blocks unpaid orders
- `sync-wc-approveflow` creates ApproveFlow projects for design product IDs: `[234, 58160, 290, 289]`
- Both send welcome/artwork-request emails via `send-approveflow-welcome`

### What's Missing (MightyCustomer Internal Orders)
- MightyCustomer quotes save to `quotes` table but have no "Mark as Paid" button
- No order number generation on payment
- No ShopFlow/ApproveFlow creation from internal quotes
- No artwork request email trigger

---

## Technical Implementation

### Part 1: Database Schema Updates

**Add payment tracking columns to `quotes` table:**

```sql
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_notes text,
ADD COLUMN IF NOT EXISTS shopflow_order_id uuid REFERENCES shopflow_orders(id),
ADD COLUMN IF NOT EXISTS approveflow_project_id uuid REFERENCES approveflow_projects(id),
ADD COLUMN IF NOT EXISTS artwork_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS artwork_status text DEFAULT 'none';

-- Add index for payment queries
CREATE INDEX IF NOT EXISTS idx_quotes_is_paid ON quotes(is_paid) WHERE is_paid = true;
```

**Add source tracking to `shopflow_orders`:**

```sql
ALTER TABLE shopflow_orders
ADD COLUMN IF NOT EXISTS source_quote_id uuid REFERENCES quotes(id);
```

---

### Part 2: New Edge Function - `convert-quote-to-order`

Create a new edge function that handles the complete conversion flow:

**Location**: `supabase/functions/convert-quote-to-order/index.ts`

**Responsibilities**:
1. Validate quote exists and has required data (customer email, product)
2. Generate order number (format: `WPW-XXXXXX` or internal format)
3. Mark quote as paid with timestamp
4. Create ShopFlow order (always)
5. Create ApproveFlow project (if design product detected)
6. Check for artwork files
7. Send appropriate email:
   - If artwork exists: "Order Received - We're Getting Started!"
   - If no artwork: "Action Needed - Upload Your Design Files"
8. Return created order IDs

**Key Logic:**

```typescript
// Design product detection - same IDs as sync-wc-approveflow
const DESIGN_PRODUCT_IDS = [234, 58160, 290, 289];
const DESIGN_PRODUCT_NAMES = [
  'custom vehicle wrap design',
  'custom design',
  'hourly design',
  'file output'
];

function isDesignProduct(productName: string, wooProductId?: number): boolean {
  if (wooProductId && DESIGN_PRODUCT_IDS.includes(wooProductId)) return true;
  const lower = productName.toLowerCase();
  return DESIGN_PRODUCT_NAMES.some(name => lower.includes(name));
}
```

**Flow Diagram:**

```text
┌─────────────────────────────────────────────────────────────────┐
│                  convert-quote-to-order                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Validate quote_id + payment_method                          │
│                       ↓                                          │
│  2. Generate order_number (WPW-XXXXXX)                          │
│                       ↓                                          │
│  3. Update quote: is_paid=true, paid_at=now()                   │
│                       ↓                                          │
│  4. Create shopflow_orders entry                                │
│     ├── order_number                                             │
│     ├── customer_name, customer_email                            │
│     ├── product_type from quote                                  │
│     ├── vehicle_info from quote                                  │
│     ├── source_quote_id = quote.id                              │
│     ├── is_paid = true                                          │
│     └── organization_id                                          │
│                       ↓                                          │
│  5. Is design product?                                          │
│     ├── YES → Create approveflow_projects entry                 │
│     │         ├── Link to shopflow order                         │
│     │         ├── Copy design instructions                       │
│     │         └── Set status = 'design_requested'               │
│     └── NO → Skip ApproveFlow                                   │
│                       ↓                                          │
│  6. Check artwork_files on quote                                │
│     ├── Has files → Send "Order Received" email                 │
│     └── No files → Send "Action Needed - Upload Files" email   │
│                       ↓                                          │
│  7. Return: { shopflow_order_id, approveflow_project_id }       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Part 3: UI Components

**New Component**: `src/components/quote/QuoteActionButtons.tsx`

Buttons for quote management:
- **Mark as Paid** - Opens payment confirmation modal
- **Convert to Order** - Only enabled after payment confirmed
- **Upload Artwork** - File upload zone

```text
┌────────────────────────────────────────────────────────┐
│ Quote #WPW-123456                    Status: Sent     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Customer: John Smith                                   │
│ Product: Avery MPI 1105 with Lamination               │
│ Total: $1,501.95                                       │
│                                                        │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📎 Artwork Files                                │   │
│ │                                                  │   │
│ │   [Drag & drop or click to upload]             │   │
│ │                                                  │   │
│ │   Uploaded: design_v1.pdf (2.4 MB)             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                        │
│ ┌────────────────────┐ ┌────────────────────────────┐ │
│ │  💳 Mark as Paid   │ │ 📦 Convert to Order        │ │
│ │                    │ │    (Requires Payment)      │ │
│ └────────────────────┘ └────────────────────────────┘ │
│                                                        │
│ ⚠️ Order number will be generated when marked as paid │
└────────────────────────────────────────────────────────┘
```

**New Component**: `src/components/quote/PaymentConfirmModal.tsx`

Modal for confirming payment:
- Payment method dropdown (Cash, Check, Credit Card, Bank Transfer, Zelle, Venmo)
- Payment notes field
- Confirm button triggers `convert-quote-to-order`

**New Component**: `src/components/quote/ArtworkUploadZone.tsx`

Dropzone for artwork files:
- Accepts: PDF, AI, EPS, PSD, PNG, JPG
- Max 50MB per file
- Stores in `media-library` bucket under `quote-artwork/{quote_id}/`
- Updates `quotes.artwork_files` JSONB array

---

### Part 4: Integration Points

**Modify**: `src/pages/MightyCustomer.tsx`

After saving a quote, show the new action buttons:
- Only show "Mark as Paid" if quote is saved
- Show artwork upload zone
- "Convert to Order" disabled until `is_paid = true`

**Modify**: `src/components/admin/WebsiteChatQuotes.tsx`

Add payment status column and actions:
- Show paid/unpaid badge
- "Mark as Paid" button in quote detail sheet
- "Convert to Order" button (enabled only if paid)

---

### Part 5: Artwork Request Email Logic

**Reuse existing email function**: The `send-approveflow-welcome` function already handles both cases:
- `hasArtwork = true` → Green banner "Order Received"
- `hasArtwork = false` → Orange banner "Action Needed - Upload Files"

**Email includes portal link** where customer can:
- View their ApproveFlow portal (if design product)
- View their ShopFlow tracking (always)
- Upload additional files

---

### Part 6: Safety Checks (Protect WePrintWraps.com)

**No changes to**:
- `sync-wc-shopflow/index.ts` - WooCommerce webhook handler
- `sync-wc-approveflow/index.ts` - WooCommerce webhook handler
- `website-chat/index.ts` - Jordan AI chat

**The new edge function is ADDITIVE**:
- It creates orders from internal quotes only
- It uses the SAME data structures as WooCommerce sync
- It follows the SAME email templates
- It generates order numbers in a separate range (internal prefix option)

**Order Number Collision Prevention**:
- WooCommerce orders use WooCommerce's auto-increment (e.g., 45678)
- Internal orders use prefix format: `INT-{timestamp}` or `MQ-{timestamp}`
- This ensures no overlap with WooCommerce order numbers

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/convert-quote-to-order/index.ts` | **Create** | New edge function for payment-gated order creation |
| `src/components/quote/QuoteActionButtons.tsx` | **Create** | Mark as Paid + Convert to Order buttons |
| `src/components/quote/PaymentConfirmModal.tsx` | **Create** | Payment confirmation modal |
| `src/components/quote/ArtworkUploadZone.tsx` | **Create** | File upload for quotes |
| `src/pages/MightyCustomer.tsx` | **Modify** | Add quote action buttons after save |
| `src/components/admin/WebsiteChatQuotes.tsx` | **Modify** | Add payment status + actions |
| `supabase/config.toml` | **Modify** | Add new function entry |
| Database migration | **Create** | Add payment columns to quotes table |

---

## Edge Function: convert-quote-to-order (Detailed)

```typescript
// Key sections of the edge function:

interface ConvertQuoteRequest {
  quote_id: string;
  payment_method: string;
  payment_notes?: string;
  organization_id?: string;
}

// 1. Generate internal order number (non-colliding with WooCommerce)
function generateInternalOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MQ-${timestamp}${random}`;
}

// 2. Detect design products
function isDesignProduct(productName: string): boolean {
  const lower = productName?.toLowerCase() || '';
  return lower.includes('design') || 
         lower.includes('custom wrap') ||
         lower.includes('hourly design') ||
         lower.includes('file output');
}

// 3. Create ShopFlow order from quote
async function createShopFlowOrder(supabase, quote, orderNumber) {
  const vehicleDetails = quote.vehicle_details 
    ? JSON.parse(quote.vehicle_details) 
    : {};
    
  return await supabase.from('shopflow_orders').insert({
    order_number: orderNumber,
    customer_name: quote.customer_name,
    customer_email: quote.customer_email,
    product_type: quote.product_name,
    status: 'order_received',
    customer_stage: 'order_received',
    vehicle_info: {
      year: quote.vehicle_year,
      make: quote.vehicle_make,
      model: quote.vehicle_model,
      ...vehicleDetails
    },
    is_paid: true,
    source_quote_id: quote.id,
    organization_id: quote.organization_id,
    order_total: quote.total_price,
    timeline: {
      order_received: new Date().toISOString()
    },
    files: quote.artwork_files || []
  }).select().single();
}

// 4. Create ApproveFlow project (only for design products)
async function createApproveFlowProject(supabase, quote, orderNumber) {
  return await supabase.from('approveflow_projects').insert({
    order_number: orderNumber,
    customer_name: quote.customer_name,
    customer_email: quote.customer_email,
    product_type: quote.product_name,
    status: 'design_requested',
    vehicle_info: {
      year: quote.vehicle_year,
      make: quote.vehicle_make,
      model: quote.vehicle_model
    },
    organization_id: quote.organization_id,
    order_total: quote.total_price
  }).select().single();
}

// 5. Send appropriate email
async function sendOrderEmail(supabase, quote, orderNumber, hasArtwork) {
  const portalUrl = isDesignProduct(quote.product_name)
    ? `https://weprintwraps.com/my-approveflow/${orderNumber}`
    : `https://weprintwraps.com/my-shopflow/${orderNumber}`;
    
  // Call existing send-approveflow-welcome function
  // It already handles hasArtwork logic
}
```

---

## Expected Workflow After Implementation

### Internal Quote → Paid Order Flow

1. **Admin creates quote in MightyCustomer**
   - Enters customer info, vehicle, product
   - Saves quote (status: "draft", no order number yet)

2. **Admin uploads artwork (optional)**
   - Uses ArtworkUploadZone
   - Files stored in `media-library` bucket
   - Quote updated with `artwork_files`

3. **Customer pays (outside system)**
   - Cash, check, credit card, etc.

4. **Admin clicks "Mark as Paid"**
   - PaymentConfirmModal opens
   - Selects payment method
   - Adds optional notes
   - Clicks Confirm

5. **System auto-creates:**
   - Order number generated (MQ-XXXXXX)
   - ShopFlow order created
   - ApproveFlow project created (if design product)
   - Quote marked as paid with timestamp

6. **Email sent automatically:**
   - If artwork uploaded: "Order Received - We're Getting Started!"
   - If no artwork: "Action Needed - Upload Your Design Files"

7. **Order appears in ShopFlow dashboard**
   - Ready for production workflow

---

## Safety Verification

| WePrintWraps.com Feature | Protected? | Verification |
|--------------------------|------------|--------------|
| WooCommerce order sync | ✅ Yes | No changes to `sync-wc-shopflow` |
| ApproveFlow design orders | ✅ Yes | No changes to `sync-wc-approveflow` |
| Website chat (Jordan) | ✅ Yes | No changes to `website-chat` |
| Email templates | ✅ Yes | Reuses existing `send-approveflow-welcome` |
| Paid gate logic | ✅ Yes | Same logic applied to internal orders |
| Order number format | ✅ Yes | Internal orders use different prefix (MQ-) |
