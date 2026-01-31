
# Integrate Specialty Configurators into MightyCustomer Quote Builder

## Current Situation

You have **four ready-to-use components** that were created but never wired into the main quote builder:

| Component | Location | Purpose |
|-----------|----------|---------|
| `QuoteInputModeToggle` | `src/components/quote/QuoteInputModeToggle.tsx` | 3-mode toggle: Total Sq Ft, Dimensions (H×W), Vehicle Selector |
| `WrapByTheYardConfigurator` | `src/components/quote/WrapByTheYardConfigurator.tsx` | Pattern + yard quantity selector for WBTY products |
| `FadeWrapConfigurator` | `src/components/quote/FadeWrapConfigurator.tsx` | Size + color + add-ons selector for FadeWraps |
| `WallWrapConfigurator` | `src/components/quote/WallWrapConfigurator.tsx` | Dimension input for wall graphics |

The detection helpers are also ready in `src/lib/wpwProducts.ts`:
- `isWBTY(productId)` - detects Wrap By The Yard products
- `isFadeWrap(productId)` - detects FadeWrap products  
- `STANDALONE_PRODUCTS.wallWrap.id` - Wall Wrap product ID (70093)

---

## Implementation Plan

### Step 1: Add Required Imports

Add imports for the specialty configurators and detection helpers:

```typescript
import { QuoteInputModeToggle, InputMode } from "@/components/quote/QuoteInputModeToggle";
import { WrapByTheYardConfigurator } from "@/components/quote/WrapByTheYardConfigurator";
import { FadeWrapConfigurator } from "@/components/quote/FadeWrapConfigurator";
import { WallWrapConfigurator } from "@/components/quote/WallWrapConfigurator";
import { isWBTY, isFadeWrap, STANDALONE_PRODUCTS } from "@/lib/wpwProducts";
```

### Step 2: Add Input Mode State

Add state for the quote input mode toggle:

```typescript
const [inputMode, setInputMode] = useState<InputMode>("vehicle");
```

### Step 3: Replace Vehicle Selector Section

The current MightyCustomer has the vehicle selector around line 614-632. This section will be enhanced:

**Before (current):**
```text
┌─────────────────────────────────────────────────────┐
│ Vehicle Information                                  │
│ [VehicleSelectorV2 Component]                       │
└─────────────────────────────────────────────────────┘
```

**After (new):**
```text
┌─────────────────────────────────────────────────────┐
│ How would you like to enter area?                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Total Sq Ft  │ │  Dimensions  │ │   Vehicle    │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                      │
│ [Mode-specific input shown here]                    │
└─────────────────────────────────────────────────────┘
```

### Step 4: Add Specialty Product Detection

When a product is selected, detect if it's a specialty product that needs a custom configurator:

```typescript
const getSpecialtyProductType = (product: Product | null) => {
  if (!product?.woo_product_id) return null;
  if (isWBTY(product.woo_product_id)) return "wbty";
  if (isFadeWrap(product.woo_product_id)) return "fadewrap";
  if (product.woo_product_id === STANDALONE_PRODUCTS.wallWrap.id) return "wallwrap";
  return null;
};

const specialtyType = getSpecialtyProductType(selectedProduct);
```

### Step 5: Conditional Configurator Rendering

Show the appropriate configurator based on the selected product:

```text
┌─────────────────────────────────────────────────────┐
│ IF product is WBTY (Wrap By The Yard):             │
│   → Show WrapByTheYardConfigurator                  │
│   → Hide vehicle/SQFT inputs                        │
│   → Price = $95.50 × yards                          │
├─────────────────────────────────────────────────────┤
│ IF product is FadeWrap:                             │
│   → Show FadeWrapConfigurator                       │
│   → Hide vehicle/SQFT inputs                        │
│   → Price = size + add-ons                          │
├─────────────────────────────────────────────────────┤
│ IF product is Wall Wrap:                            │
│   → Show WallWrapConfigurator                       │
│   → Hide vehicle selector (use H×W input)           │
│   → Price = sqft × $3.25                            │
├─────────────────────────────────────────────────────┤
│ ELSE (standard vehicle wrap product):               │
│   → Show QuoteInputModeToggle                       │
│   → Show normal quote flow                          │
└─────────────────────────────────────────────────────┘
```

### Step 6: Update Add to Cart Handlers

Connect the configurator callbacks to the add-to-cart edge function with variation data:

```typescript
const handleWBTYAddToCart = async (config) => {
  // Call add-to-woo-cart with pattern/yards data
  await supabase.functions.invoke('add-to-woo-cart', {
    body: {
      product_id: config.productId,
      quantity: 1,
      variation_id: config.variationId,
      meta_data: [
        { key: "Pattern", value: config.pattern },
        { key: "Yards", value: config.yards }
      ]
    }
  });
};

const handleFadeWrapAddToCart = async (config) => {
  // Similar handling for FadeWrap configuration
};
```

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MightyCustomer.tsx` | Add imports, state, conditional rendering for all configurators |

### UI Flow After Implementation

```text
1. User selects "WePrintWraps.com products" category
                    ↓
2. User clicks on a product
                    ↓
3. System detects product type:
   
   WBTY Product?
   ├── YES → Display WrapByTheYardConfigurator
   │         (Pattern grid + Yard selector)
   │         [Add to Cart] button
   │
   FadeWrap Product?
   ├── YES → Display FadeWrapConfigurator
   │         (Color + Size + Add-ons)
   │         [Add to Cart] button
   │
   Wall Wrap Product?
   ├── YES → Display WallWrapConfigurator
   │         (H × W inputs + Finish)
   │         [Add to Quote] button
   │
   Standard Product?
   └── YES → Display QuoteInputModeToggle
             (Total Sq Ft | Dimensions | Vehicle)
             + Normal quote flow
```

### Specialty Product Detection Logic

```typescript
// Product IDs for detection
const WBTY_IDS = [1726, 39698, 4181, 42809, 52489];  // 5 collections
const FADEWRAP_ID = 58391;
const WALLWRAP_ID = 70093;
```

---

## Summary

This implementation will:

1. Add the 3-mode quote input toggle (Total Sq Ft / Dimensions / Vehicle)
2. Show specialty configurators when WBTY, FadeWrap, or Wall Wrap products are selected
3. Hide the standard vehicle/SQFT inputs for specialty products that don't need them
4. Connect all configurators to the add-to-cart function with proper variation/meta data

The components are already built and tested - they just need to be wired into the main quote builder page.
