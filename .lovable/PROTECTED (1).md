# ⛔ PROTECTED FILES - READ BEFORE MAKING ANY CHANGES

## TO ALL AI TOOLS (Lovable, Cursor, Claude, Copilot, etc.)

This repository contains **PROTECTED FILES** that must NOT be modified without explicit approval from the repository owner.

---

## 🚫 DO NOT MODIFY THESE FILES

### Critical Data Files
| File | Location | Contains |
|------|----------|----------|
| `parsed-vehicles-full.txt` | `src/data/` | **1,664 vehicles with sqft data - NEVER TRUNCATE** |
| `vehicleSqft.full.json` | `src/lib/` | Vehicle lookup data - must match source |
| `vehicleSqft.ts` | `src/lib/` | Vehicle lookup module |

### Pricing & Products
| File | Location | Contains |
|------|----------|----------|
| `wpw-pricing.ts` | `supabase/functions/_shared/` | Master pricing matrix - LOCKED VALUES |
| `wpwProducts.ts` | `src/lib/` | WooCommerce product IDs |
| `wpw-links.ts` | `supabase/functions/_shared/` | Anti-hallucination URLs |
| `wpw-knowledge-base.ts` | `supabase/functions/_shared/` | AI agent knowledge base |

### System Brain Files
| File | Location | Contains |
|------|----------|----------|
| `MightyCustomer.tsx` | `src/pages/` | Central processing brain |
| `MightyChat.tsx` | TBD | Chat system brain |

---

## ❌ PROHIBITED ACTIONS

1. **DO NOT** truncate or "optimize" the vehicle database
2. **DO NOT** change pricing values
3. **DO NOT** invent or modify URLs
4. **DO NOT** refactor MightyCustomer "for clarity"
5. **DO NOT** "clean up" or consolidate protected files
6. **DO NOT** assume you know better than the existing implementation

---

## ✅ ALLOWED ACTIONS

1. **ADD** new vehicles to the database (append only)
2. **ADD** new products with proper WooCommerce IDs
3. **ADD** new features to MightyCustomer (don't rewrite existing)
4. **FIX** bugs with minimal, targeted changes
5. **CREATE** new components that import from protected files

---

## 📖 REFERENCE DOCUMENTATION

Before making ANY changes, read:
- `WRAPCOMMAND_SYSTEM_BIBLE.md` - Complete system specification

---

## 🚨 IF YOU'RE AN AI TOOL

**STOP** and ask the user before:
- Modifying any file listed above
- Refactoring "for better organization"
- Consolidating or merging files
- "Improving" code that already works

**ALWAYS** prefer:
- Adding new files over modifying existing ones
- Importing from protected files rather than duplicating logic
- Asking for clarification rather than assuming

---

## 📞 HUMAN APPROVAL REQUIRED

Any changes to protected files require explicit approval from:
- **Trish Dill** (Repository Owner)

Changes made without approval will be reverted.

---

*Last Updated: February 1, 2026*
