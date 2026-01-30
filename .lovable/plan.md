
# Fix ShopFlow Orders Missing Totals

## Problem Summary

| Status | Count |
|--------|-------|
| Orders with totals | 510 ✅ |
| Orders missing totals | 295 ⚠️ |
| **Total orders** | 805 |

The sync function (`sync-wc-shopflow`) is correctly saving `order_total` for new orders. However:
1. **295 older orders** were synced before `order_total` was added to the sync logic
2. **ShopFlowCard** (the card in the list view) does NOT display the order total

---

## Solution: Two-Part Fix

### Part 1: Add Order Total to ShopFlowCard

The `ShopFlowCard` component currently shows:
- Product type
- Order number
- Customer name
- Status tag

**Missing**: Order total

Will add the order total display below the customer name, matching the styling from `JobDetailsCard`.

### Part 2: Backfill Missing Order Totals

Create a one-time backfill script to fetch order totals from WooCommerce for the 295 orders missing data.

---

## File Changes

### File 1: `src/modules/shopflow/components/ShopFlowCard.tsx`

Add order total display to the card:

```text
Current card layout:
┌─────────────────────────────────┐
│ [Icon]  Product Type            │
│         Order #12345            │
│         Customer Name           │
│         [Status Tag]            │
│ [───── View Details ─────]      │
└─────────────────────────────────┘

Updated layout:
┌─────────────────────────────────┐
│ [Icon]  Product Type            │
│         Order #12345            │
│         Customer Name           │
│         💵 $1,234.00            │  ← NEW
│         [Status Tag]            │
│ [───── View Details ─────]      │
└─────────────────────────────────┘
```

Changes to ShopFlowCard.tsx:
- Import `DollarSign` icon from lucide-react
- Add conditional rendering of order total after customer name
- Style with green text to match JobDetailsCard

### File 2: Create Backfill Edge Function

Create `supabase/functions/backfill-order-totals/index.ts` to:
1. Query shopflow_orders where `order_total` is 0 or NULL
2. For each order, fetch the total from WooCommerce API using `order_number`
3. Update the `order_total` field

This is a one-time utility function that can be invoked manually.

---

## Implementation Steps

1. **Update ShopFlowCard** to display order totals (immediate visual fix)
2. **Create backfill function** to populate missing totals from WooCommerce
3. **Run backfill** to update 295 orders with missing data

---

## Expected Result

After implementation:
- All ShopFlow cards will show order totals (when available)
- Running the backfill will populate the 295 missing order totals
- Future orders will continue to sync correctly (already working)

---

## Technical Notes

### WooCommerce API for Backfill

The backfill function will use:
```
GET /wp-json/wc/v3/orders/{order_number}
```

Extract: `response.total` → save to `shopflow_orders.order_total`

### Rate Limiting

Will process orders in batches of 10 with 500ms delays to avoid overwhelming the WooCommerce API.
