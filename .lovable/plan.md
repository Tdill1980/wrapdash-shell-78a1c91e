
# ApprovePro/ApproveFlow Architecture: 2D → 3D Workflow

## System Overview

ApproveFlow is a design proof approval system that transforms 2D wrap artwork into 6-view 3D studio renders for customer approval. The system enforces strict separation: **Designers create proofs. Customers approve artifacts.**

---

## Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           APPROVEFLOW 2D → 3D PIPELINE                               │
└──────────────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────────┐
     │  WooCommerce    │─────►│ sync-wc-        │─────►│  approveflow_projects       │
     │  Order Created  │      │ approveflow     │      │  (Source of Truth)          │
     └─────────────────┘      └─────────────────┘      └──────────────┬──────────────┘
                                                                      │
                                                       ┌──────────────▼──────────────┐
                                                       │  DESIGNER UPLOADS 2D PROOF  │
                                                       │  src/pages/ApproveFlow.tsx  │
                                                       └──────────────┬──────────────┘
                                                                      │
┌─────────────────────────────────────────────────────────────────────┼────────────────┐
│ STEP 1: UPLOAD 2D DESIGN                                            │                │
│ ─────────────────────────                                           ▼                │
│ • Designer uploads flat artwork                      ┌─────────────────────────────┐ │
│ • Stored in: approveflow-files bucket               │  approveflow_versions       │ │
│ • Tracked in: approveflow_versions table            │  (version_number, file_url) │ │
│                                                      └──────────────┬──────────────┘ │
└─────────────────────────────────────────────────────────────────────┼────────────────┘
                                                                      │
┌─────────────────────────────────────────────────────────────────────┼────────────────┐
│ STEP 2: GENERATE 3D STUDIO RENDERS (Button: "Generate Studio Renders")              │
│ ─────────────────────────────────────────                           ▼                │
│                                                      ┌─────────────────────────────┐ │
│  Frontend triggers:                                  │  generate-studio-renders    │ │
│  supabase.functions.invoke('generate-studio-renders')│  (StudioRenderOS)           │ │
│                                                      └──────────────┬──────────────┘ │
│                                                                     │                │
│  ┌──────────────────────────────────────────────────────────────────┼──────────────┐ │
│  │ StudioRenderOS - LOCKED 6-VIEW GENERATION                        ▼              │ │
│  │ ────────────────────────────────────────                                        │ │
│  │ Generates 6 deterministic views:                                                │ │
│  │   1. driver_side (45° front-left)                                               │ │
│  │   2. front (centered, slight elevation)                                         │ │
│  │   3. rear (centered, slight elevation)                                          │ │
│  │   4. passenger_side (45° front-right)                                           │ │
│  │   5. top (overhead drone view)                                                  │ │
│  │   6. detail (macro close-up)                                                    │ │
│  │                                                                                 │ │
│  │ LOCKED STUDIO ENVIRONMENT:                                                      │ │
│  │   • Light gray cyclorama (#D1D5DB)                                              │ │
│  │   • Dark textured concrete floor                                                │ │
│  │   • 3-point automotive lighting                                                 │ │
│  │                                                                                 │ │
│  │ AI Model: google/gemini-3-pro-image-preview                                     │ │
│  │ via: https://ai.gateway.lovable.dev/v1/chat/completions                         │ │
│  └──────────────────────────────────────────────────────────────────┬──────────────┘ │
│                                                                     │                │
│                                                                     ▼                │
│                                                      ┌─────────────────────────────┐ │
│                                                      │  apply-render-branding      │ │
│                                                      │  (Adds watermarks)          │ │
│                                                      └──────────────┬──────────────┘ │
│                                                                     │                │
│  Branding Applied (PHASE 2 - LOCKED):                               │                │
│    • Top-left: "WrapCommandAI™ for WPW" + "ApproveFlow™"            │                │
│    • Bottom-right: "Order #XXXXX"                                   │                │
│                                                                     │                │
│                                                                     ▼                │
│                                                      ┌─────────────────────────────┐ │
│                                                      │  approveflow_3d             │ │
│                                                      │  (render_urls: JSON)        │ │
│                                                      └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                                                      │
┌─────────────────────────────────────────────────────────────────────┼────────────────┐
│ STEP 3: CREATE APPROVAL PROOF (Button: "Generate Approval Proof")   │                │
│ ─────────────────────────────────────────                           ▼                │
│                                                      ┌─────────────────────────────┐ │
│  ApproveFlow.tsx creates:                            │  approveflow_proof_versions │ │
│    1. approveflow_proof_versions (metadata)          │  (order_number, vehicle,    │ │
│    2. approveflow_proof_views (6 image URLs)         │   total_sq_ft, wrap_scope)  │ │
│    3. approveflow_production_specs (dimensions)      │                             │ │
│                                                      └──────────────┬──────────────┘ │
│                                                                     │                │
│                                                                     ▼                │
│                                                      ┌─────────────────────────────┐ │
│                                                      │  validate-approveflow-proof │ │
│                                                      │  (Server-side gate)         │ │
│                                                      └──────────────┬──────────────┘ │
│                                                                     │                │
│  VALIDATION CHECKS (ALL MUST PASS):                                 │                │
│    ✓ order_number exists                                            │                │
│    ✓ vehicle_year, vehicle_make, vehicle_model                      │                │
│    ✓ total_sq_ft (REQUIRED)                                         │                │
│    ✓ wrap_scope (REQUIRED)                                          │                │
│    ✓ All 6 canonical views present                                  │                │
│                                                                     │                │
│                                                                     ▼                │
│                                                      ┌─────────────────────────────┐ │
│                                                      │  generate-approveflow-      │ │
│                                                      │  proof-pdf                  │ │
│                                                      └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                                                      │
┌─────────────────────────────────────────────────────────────────────┼────────────────┐
│ STEP 4: CUSTOMER APPROVAL (Read-Only Customer View)                 │                │
│ ───────────────────────────────────────────                         ▼                │
│                                                      ┌─────────────────────────────┐ │
│  TWO CUSTOMER-FACING PAGES:                          │  MyApproveFlow.tsx          │ │
│                                                      │  Route: /myapproveflow/     │ │
│  1. /myapproveflow/:orderNumber                      │    :orderNumber             │ │
│     • Lookup by order number                         │                             │ │
│     • Full page with specs, history, chat            │  ApproveFlowProof.tsx       │ │
│                                                      │  Route: /approveflow/       │ │
│  2. /approveflow/:projectId/proof                    │    :projectId/proof         │ │
│     • Direct project link                            └──────────────┬──────────────┘ │
│     • Clean approval UI                                             │                │
│                                                                     │                │
│  CUSTOMER ACTIONS (via edge function ONLY):                         ▼                │
│    • ✅ Approve → approve-approveflow-proof          ┌─────────────────────────────┐ │
│    • 🔄 Request Revision → direct DB insert          │  approve-approveflow-proof  │ │
│                                                      │  (Locks proof forever)      │ │
│                                                      └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Code Locations

### Frontend (React/TypeScript)

| Path | Purpose |
|------|---------|
| `src/pages/ApproveFlow.tsx` | **Designer internal page** - Upload 2D, generate 3D, create proofs |
| `src/pages/ApproveFlowList.tsx` | List all ApproveFlow projects |
| `src/pages/ApproveFlowProof.tsx` | **Customer page** (by projectId) - View/approve proof |
| `src/pages/MyApproveFlow.tsx` | **Customer page** (by orderNumber) - View/approve with full history |
| `src/hooks/useApproveFlow.ts` | Data fetching hook with realtime subscriptions |
| `src/lib/approveflow-helpers.ts` | Helpers: create project from quote, save 3D renders |
| `src/lib/os-constants.ts` | Locked branding constants (BRAND_LINE_1, BRAND_LINE_2) |

### Designer Components (`src/components/approveflow/`)

| File | Purpose |
|------|---------|
| `ApproveFlowModeBar.tsx` | Status bar showing "DESIGNER MODE" |
| `ApproveFlowSourceOfTruth.tsx` | WooCommerce data (read-only) |
| `DesignerProductionSpecs.tsx` | Form for vehicle specs (wheelbase, roof height, etc.) |
| `ProofSixViewGrid.tsx` | 6-view render display grid |
| `BrandedViewOverlay.tsx` | Watermark/branding overlay component |

### Customer Components (`src/components/myapproveflow/`)

| File | Purpose |
|------|---------|
| `MyApproveFlowHeader.tsx` | Status display header |
| `MyApproveFlowViewGrid.tsx` | 6-view grid (read-only, branded) |
| `MyApproveFlowSpecs.tsx` | Production specs display |
| `MyApproveFlowActions.tsx` | Approve/Revision buttons |
| `MyApproveFlowMessages.tsx` | Customer chat interface |

### Edge Functions (`supabase/functions/`)

| Function | Purpose |
|----------|---------|
| `generate-studio-renders/` | **StudioRenderOS** - Generates 6 locked 3D views |
| `generate-3d/` | Generic 3D render (uses vehicle_models table) |
| `generate-3dproof/` | Simpler 3D proof generation |
| `apply-render-branding/` | Applies watermarks to renders |
| `validate-approveflow-proof/` | Server-side gate - validates all requirements |
| `generate-approveflow-proof-pdf/` | Creates downloadable PDF |
| `approve-approveflow-proof/` | **Locks proof forever** after customer approval |
| `send-approveflow-proof/` | Emails proof link to customer |
| `send-approveflow-welcome/` | Welcome email on project creation |
| `notify-approveflow-team/` | Internal team notification |
| `sync-wc-approveflow/` | Syncs WooCommerce orders → approveflow_projects |

---

## Database Tables

```text
approveflow_projects       → Master project record (customer, order, vehicle)
approveflow_versions       → 2D design versions uploaded by designer
approveflow_3d            → 3D render URLs (JSON: {driver_side, front, rear...})
approveflow_proof_versions → Immutable proof snapshots for customer approval
approveflow_proof_views    → 6 view images for each proof version
approveflow_production_specs → Vehicle dimensions (wheelbase, roof height...)
approveflow_assets         → Customer uploaded reference files
approveflow_chat           → Designer ↔ Customer messaging
approveflow_actions        → Audit log (approved, revision_requested, etc.)
approveflow_email_logs     → Email delivery tracking
```

---

## OS Rules (Non-Negotiable)

1. **WooCommerce data is canonical** - Never edit, only display
2. **Designers create proofs. Customers approve artifacts.** - Customers never generate
3. **All renders are branded** - No raw/unbranded images leave the system
4. **Approval goes through edge function ONLY** - UI cannot bypass validation
5. **6 canonical views are LOCKED**: `driver_side`, `passenger_side`, `front`, `rear`, `top`, `detail`
6. **Order number is resolved from DB** - Never from request payload (security)

---

## Flow Summary

```text
1. WooCommerce Order → sync-wc-approveflow → approveflow_projects
2. Designer uploads 2D artwork → approveflow_versions
3. Designer clicks "Generate Studio Renders" → generate-studio-renders → apply-render-branding → approveflow_3d
4. Designer fills specs + clicks "Generate Approval Proof" → validate-approveflow-proof → generate-approveflow-proof-pdf → approveflow_proof_versions
5. Customer receives email link → MyApproveFlow.tsx or ApproveFlowProof.tsx
6. Customer approves → approve-approveflow-proof → proof LOCKED forever
```
