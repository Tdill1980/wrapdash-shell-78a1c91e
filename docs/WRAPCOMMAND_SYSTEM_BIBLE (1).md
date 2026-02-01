# 📖 WRAPCOMMAND SYSTEM BIBLE v1.0
## The Authoritative Source of Truth
**Last Updated:** February 1, 2026  
**Maintained By:** Trish Dill  
**Purpose:** This document is the CANONICAL reference for all WrapCommand AI systems. Any AI tool, developer, or automation that modifies system files MUST reference this Bible first.

---

# ⛔ CRITICAL PROTECTION RULES

## FILES THAT CANNOT BE MODIFIED WITHOUT EXPLICIT APPROVAL

| File | Location | Why Protected |
|------|----------|---------------|
| `parsed-vehicles-full.txt` | `src/data/` | **1,667 vehicles - NEVER TRUNCATE** |
| `wpw-pricing.ts` | `supabase/functions/_shared/` | Master pricing - locked values |
| `wpwProducts.ts` | `src/lib/` | Product IDs - WooCommerce integration |
| `wpw-links.ts` | `supabase/functions/_shared/` | Anti-hallucination URLs |
| `wpw-knowledge-base.ts` | `supabase/functions/_shared/` | AI agent knowledge |
| `MightyCustomer.tsx` | `src/pages/` | THE SYSTEM BRAIN |
| `MightyChat.tsx` | (location TBD) | Chat system brain |
| `vehicleSqft.ts` | `src/lib/` | Vehicle lookup module |

### MODIFICATION RULES
1. **NEVER** truncate vehicle data (must remain 1,667+ vehicles)
2. **NEVER** change pricing values without business approval
3. **NEVER** invent URLs - only use approved links
4. **NEVER** "optimize" or "clean up" protected files
5. **NEVER** refactor MightyCustomer without explicit approval

---

# 🚗 SECTION 1: VEHICLE DATABASE

## CANONICAL SOURCE: `src/data/parsed-vehicles-full.txt`

**Total Vehicles: 1,664**  
**Format: Pipe-delimited table**  
**Source: PVO_Square_Footage_List_2020.xlsx**  
**Coverage: Vehicles through 2020 model year**

### ⚠️ IMPORTANT: This database covers vehicles through ~2020. Newer vehicles (2021+) may need to be added manually or use category estimates.

### Data Structure Per Vehicle
```
|Make|Model|Year|Side Width|Side Height|Side Sq Ft|Back Width|Back Height|Back Sq Ft|Hood Width|Hood Length|Hood Sq Ft|Roof Width|Roof Length|Roof Squ Ft|Total Sq Foot|
```

### Sample Entries
```
|Ford|F-150 Crew Cab Short Box|2015-2020|232.5|59.8|109.3|78.1|55.9|36.2|78.0|52.5|34.1|64.0|87.0|45.6|329.5|
|Chevrolet|Silverado 1500 Crew Cab Short Box|2014-2018|226.1|60.6|107.5|72.2|56.5|34.0|72.0|52.0|31.7|60.0|68.0|34.0|303.2|
|Toyota|Tacoma Double Cab|2016-2020|208.5|55.4|91.5|72.0|50.8|30.6|66.7|42.3|24.0|52.0|63.0|27.8|248.2|
```

### Vehicle Makes Included (Partial List)
- Acura, Audi, BMW, Buick, Cadillac, Chevrolet, Chrysler, Dodge, Ford, GMC
- Honda, Hyundai, Infiniti, Jeep, Kia, Lexus, Lincoln, Mazda, Mercedes-Benz
- Mercury, Mini, Mitsubishi, Nissan, Oldsmobile, Plymouth, Pontiac, Porsche
- Ram, Saturn, Scion, Subaru, Suzuki, Tesla, Toyota, Volkswagen, Volvo
- Western Star (Commercial trucks)

### ⚠️ CRITICAL: VEHICLE DATABASE SYNC

The CANONICAL source is `parsed-vehicles-full.txt` with **1,664 vehicles**.

**Current State of Other Locations:**
- `vehicleSqft.full.json`: Only ~219 vehicles (BROKEN - needs full 1,664)
- Supabase `vehicle_dimensions` table: Only ~231 vehicles (BROKEN)

**THE FIX:** Replace `vehicleSqft.full.json` with the complete 1,664-vehicle JSON provided in this Bible's companion files.

---

# 💰 SECTION 2: PRICING ENGINE

## CANONICAL SOURCE: `supabase/functions/_shared/wpw-pricing.ts`

### Per Square Foot Products

| Product | Price/SqFt | WooCommerce ID | Notes |
|---------|------------|----------------|-------|
| Avery MPI 1105 EGRS + DOL 1460Z | **$5.27** | 79 | Standard option |
| 3M IJ180Cv3 + 8518 Lamination | **$5.27** | 72 | PRICE DROP (was $6.32) |
| Avery Cut Contour Vinyl | **$6.32** | 108 | Weeded & masked |
| 3M Cut Contour Vinyl | **$6.92** | 19420 | Weeded & masked |
| Window Perf 50/50 | **$5.95** | 80 | STANDALONE - no vehicle required |

### Specialty Products

#### InkFusion™ (Suite-Based - NOT Chat Quoted)
| Attribute | Value |
|-----------|-------|
| Price Per Roll | **$2,075** |
| Coverage | 375 sqft (~24 yards) |
| Width | 60 inches |
| Film | Avery SW900 |
| Laminate | DOL1360 Max Gloss |
| Finishes | Gloss, Luster |
| WooCommerce ID | 69439 |
| Order Path | RestylePro → PrintPro Suite → Add to Cart |

#### Wrap By The Yard
| Attribute | Value |
|-----------|-------|
| Price Per Yard | **$95.50** |
| Yard Options | 1, 5, 10, 25, 50 |

**Collections:**
| Collection | WooCommerce ID |
|------------|----------------|
| Camo & Carbon | 1726 |
| Metal & Marble | 39698 |
| Wicked & Wild | 4181 |
| Bape Camo | 42809 |
| Modern & Trippy | 52489 |

#### FadeWraps (Pre-Designed)
**WooCommerce ID: 58391**

| Size | Dimensions | Price |
|------|------------|-------|
| Small | 144x59.5" | **$600** |
| Medium | 172x59.5" | **$710** |
| Large | 200x59.5" | **$825** |
| XL | 240x59.5" | **$990** |

**Add-Ons:**
| Add-On | Dimensions | Price |
|--------|------------|-------|
| Hood | 72x59.5" | **$160** |
| Front Bumper | 38x120.5" | **$200** |
| Rear + Bumper | 59x72.5" + 38x120" | **$395** |
| Roof Small | 72x59.5" | **$160** |
| Roof Medium | 110x59.5" | **$225** |
| Roof Large | 160x59.5" | **$330** |

### Design Services
| Service | Price |
|---------|-------|
| Custom Vehicle Wrap Design | **$750** |
| Design Setup / File Output | **$50** |
| Hourly Design Work | **$150/hour** |

### Standalone Products (NO Vehicle Required)
These products can be quoted directly without asking for vehicle info:
- Window Perf (ID: 80) - $5.95/sqft
- Avery Cut Contour (ID: 108) - $6.32/sqft
- 3M Cut Contour (ID: 19420) - $6.92/sqft

---

# 📦 SECTION 3: PRODUCT CATALOG

## CANONICAL SOURCE: `src/lib/wpwProducts.ts`

### WooCommerce Allowed Product IDs
```typescript
export const WPW_ALLOWED_PRODUCT_IDS = [
  // Printed Wrap Films
  79,    // Avery MPI 1105 - $5.27/sqft
  72,    // 3M IJ180Cv3 - $5.27/sqft
  
  // Contour Cut
  108,   // Avery Cut Contour - $6.32/sqft
  19420, // 3M Cut Contour - $6.92/sqft
  
  // Specialty
  80,    // Window Perf 50/50 - $5.95/sqft
  58391, // FadeWraps - $600-$990
  69439, // InkFusion - $2,075/roll
  
  // Wrap By The Yard
  1726,  // Camo & Carbon
  39698, // Metal & Marble
  4181,  // Wicked & Wild
  42809, // Bape Camo
  52489, // Modern & Trippy
  
  // Design Services
  234,   // Custom Vehicle Wrap Design - $750
  58160, // Custom Design (Copy/Draft)
  
  // Samples & Extras
  15192, // Pantone Color Chart
  475,   // Camo & Carbon Sample Book
  39628, // Marble & Metals Swatch Book
];
```

---

# 🔗 SECTION 4: APPROVED URLS

## CANONICAL SOURCE: `supabase/functions/_shared/wpw-links.ts`

### ⚠️ ANTI-HALLUCINATION RULE
AI agents may ONLY use URLs from this approved list. Never invent URLs.

### ⛔ KNOWN BROKEN URLS (DO NOT USE)
These URLs were hallucinated and return 404:
- ~~`https://weprintwraps.com/products/custom-printed-wraps`~~ ❌ FAKE
- ~~`https://weprintwraps.com/pages/commercialpro`~~ ❌ FAKE  
- ~~`https://weprintwraps.com/pages/restylepro`~~ ❌ FAKE
- ~~`https://weprintwraps.com/collections/laminates`~~ ❌ FAKE
- ~~`https://weprintwraps.com/pages/clubwpw`~~ ❌ FAKE
- ~~`https://weprintwraps.com/pages/wrapcommandai`~~ ❌ FAKE

### ✅ VERIFIED WORKING URLS (February 2026)

#### Main Site Pages
| Key | URL |
|-----|-----|
| homepage | https://weprintwraps.com/ |
| how_to_order | https://weprintwraps.com/how-to-order/ |
| faqs | https://weprintwraps.com/faqs/ |
| shipping | https://weprintwraps.com/#shipping |
| rewards | https://weprintwraps.com/reward-landing/ |
| media | https://weprintwraps.com/media/ |
| design_videos | https://weprintwraps.com/design-videos/ |
| video_gallery | https://weprintwraps.com/video-gallery/ |
| contact | https://weprintwraps.com/contact/ |

#### Product Pages (VERIFIED)
| Product | URL |
|---------|-----|
| Avery MPI 1105 | https://weprintwraps.com/our-products/avery-1105egrs-with-doz13607-lamination/ |
| 3M IJ180 | https://weprintwraps.com/our-products/3m-ij180-printed-wrap-film/ |
| Avery Contour Cut | https://weprintwraps.com/our-products/avery-cut-contour-vinyl-graphics-54-roll-max-artwork-size-50/ |
| 3M Contour Cut | https://weprintwraps.com/our-products/3m-cut-contour-vinyl-graphics-54-roll-max-artwork-size-50/ |
| Window Perf | https://weprintwraps.com/our-products/perforated-window-vinyl-5050-unlaminated/ |
| Wall Wrap | https://weprintwraps.com/our-products/wall-wrap-printed-vinyl/ |
| Fade Wraps | https://weprintwraps.com/our-products/pre-designed-fade-wraps/ |

#### Wrap By The Yard Collections
| Collection | URL |
|------------|-----|
| Wicked & Wild | https://weprintwraps.com/our-products/wrap-by-the-yard-wicked-wild-wrap-prints/ |
| Bape Camo | https://weprintwraps.com/our-products/wrap-by-the-yard-bape-camo/ |
| Modern & Trippy | https://weprintwraps.com/our-products/wrap-by-the-yard-modern-trippy/ |
| Metal & Marble | https://weprintwraps.com/our-products/wrap-by-the-yard-metal-marble/ |
| Camo & Carbon | https://weprintwraps.com/our-products/camo-carbon-wrap-by-the-yard/ |

#### Design Services
| Service | URL |
|---------|-----|
| Custom Design | https://weprintwraps.com/our-products/custom-wrap-design/ |
| Design Setup | https://weprintwraps.com/our-products/design-setupfile-output/ |

#### Ordering
| Key | URL |
|-----|-----|
| Homepage Quote | https://weprintwraps.com/#quote |
| How to Order | https://weprintwraps.com/how-to-order/ |

---

# 🧠 SECTION 5: MIGHTYCUSTOMER SPECIFICATION

## Role: THE CENTRAL BRAIN

MightyCustomer is the central processing unit of the WrapCommand system. It:
1. Receives leads from Jordan AI (website chat), VAPI (phone), and email
2. Performs vehicle SQFT lookups (1,667 vehicles)
3. Calculates pricing with margins
4. Generates quotes and syncs to contacts table
5. Triggers downstream workflows on "Mark as Paid"

### Data Flow
```
INPUTS:
├── Jordan AI (website chat) → URL params / autofill
├── VAPI Phone (Taylor) → Lead creation → autofill
├── Email/Social → Manual entry
└── Direct visits → Manual quote building

PROCESSING:
├── Vehicle SQFT lookup (1,667 vehicles)
├── Pricing calculation (base × sqft × margin)
├── Quote generation
├── Contact table sync
└── "Mark as Paid" trigger

OUTPUTS:
├── → ApproveFlow (design approval workflow)
├── → ShopFlow (production tracking)
├── → MightyPortfolio (documentation/showcase)
└── → WooCommerce cart (for WPW fulfillment)
```

### Three Pricing Input Paths

**Path 1: Enter Sq Ft Directly**
- User types square footage
- System calculates: sqft × price_per_sqft = total

**Path 2: Enter Dimensions**
- User types Width × Height (inches)
- System calculates: (W × H) / 144 = sqft → sqft × price = total

**Path 3: Choose Vehicle (Full Wrap)**
- User selects Year/Make/Model
- System looks up vehicle in 1,667-vehicle database
- Returns total sqft + panel breakdown
- Calculates: vehicle_sqft × price_per_sqft = total

### Protected Functions (NEVER MODIFY)
- Vehicle lookup logic
- Pricing calculation logic
- ApproveFlow trigger
- ShopFlow trigger
- WooCommerce cart integration
- Contact sync logic

---

# 🔌 SECTION 6: SYSTEM INTEGRATIONS

## ApproveFlow
**Trigger:** Quote marked as "Paid"
**Creates:** ApproveFlow project
**Purpose:** Design verification gate between payment and production

### Workflow
```
Quote Paid → ApproveFlow Project Created → Designer Uploads Proof →
6-View Renders Generated → Customer Reviews → Approve/Request Revisions →
Approved → Production Begins
```

## ShopFlow
**Trigger:** Quote marked as "Paid"
**Creates:** ShopFlow order
**Purpose:** Production tracking through the print shop

### Internal Stages
```
order_received → files_received → in_design → awaiting_approval →
design_complete → print_production → ready_for_pickup → shipped
```

## MightyPortfolio
**Trigger:** ShopFlow reaches "ready_for_pickup"
**Creates:** Portfolio job
**Purpose:** 
- Liability documentation (VIN + before photos)
- Marketing showcase (after photos)

## WooCommerce
**Action:** "Add to WPW Cart"
**Purpose:** For subdomain shops using WePrintWraps fulfillment
**Product IDs:** Must match `WPW_ALLOWED_PRODUCT_IDS`

---

# 📋 SECTION 7: AI AGENT RULES

## Jordan AI (Website Chat)
- Uses pricing from `wpw-pricing.ts`
- Uses URLs from `wpw-links.ts` ONLY
- Never invents prices or URLs
- Collects: Vehicle, Film preference, Contact info
- Generates quote via system (doesn't calculate manually)

## VAPI Phone (Taylor)
- Quick quote: $5.27/sqft for print-ready material
- Creates lead in contacts table
- Texts shop owner alert
- Passes lead data to MightyCustomer

## Quote Rules
1. Always collect vehicle info FIRST (unless standalone product)
2. Never manually calculate prices - let system do it
3. Free shipping on orders over $750
4. Production: 1-2 business days
5. Shipping: 1-3 days continental US

---

# ✅ SECTION 8: DEPLOYMENT CHECKLIST

Before any deployment, verify:

- [ ] Vehicle database has 1,667+ entries
- [ ] `vehicleSqft.full.json` matches source
- [ ] All pricing values match this Bible
- [ ] All WooCommerce IDs are correct
- [ ] All URLs are valid (test each one)
- [ ] MightyCustomer loads without errors
- [ ] Vehicle lookup returns correct sqft
- [ ] Quote calculation matches expected values
- [ ] ApproveFlow trigger works
- [ ] ShopFlow trigger works

---

# 🚨 SECTION 9: "DID LOVABLE BREAK IT?" CHECKLIST

After ANY Lovable session, check:

1. **Vehicle Count**
   ```bash
   wc -l src/data/parsed-vehicles-full.txt
   # Should be ~1,669 lines (includes headers)
   ```

2. **JSON Vehicle Count**
   ```bash
   cat src/lib/vehicleSqft.full.json | jq length
   # Should be 1,664 vehicles
   ```

3. **Pricing Values**
   - Avery: $5.27 ✓
   - 3M: $5.27 ✓
   - Window Perf: $5.95 ✓
   - InkFusion: $2,075/roll ✓

4. **Protected Files Modified?**
   ```bash
   git diff --name-only HEAD~1
   # Check if protected files were touched
   ```

5. **Test Quote Flow**
   - Select 2020 Ford F-150
   - Should return ~280+ sqft
   - With Avery film: ~$1,475+

---

# 📝 SECTION 10: CHANGE LOG

| Date | Change | By |
|------|--------|-----|
| 2026-02-01 | Initial Bible created | Trish/Claude |
| | | |

---

# 🆘 EMERGENCY CONTACTS

If the system breaks:
1. Check this Bible for correct values
2. Restore from last known good backup
3. DO NOT let Lovable "fix" it without supervision

---

**END OF WRAPCOMMAND SYSTEM BIBLE v1.0**
