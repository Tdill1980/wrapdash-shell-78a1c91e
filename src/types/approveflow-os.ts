// ============================================
// ApproveFlow OS - Canonical Type Definitions
// ============================================
// LOCKED — These types define the OS contract.
// Writers and readers MUST use these exact types.
// Any changes require a new version (e.g., V2).
// ============================================

/**
 * Canonical view keys for studio renders.
 * These are the ONLY allowed render view keys in the system.
 * 
 * HARD LOCK: No "hero", no "side", no aliases in storage.
 */
export type StudioViewKey = 
  | 'driver_side'
  | 'passenger_side'
  | 'front'
  | 'rear'
  | 'top'
  | 'detail';

/**
 * Ordered array of all required view keys.
 * Used for validation and iteration.
 */
export const STUDIO_VIEW_KEYS: StudioViewKey[] = [
  'driver_side',
  'passenger_side', 
  'front',
  'rear',
  'top',
  'detail'
] as const;

/**
 * View metadata for UI display.
 * Order determines rendering sequence.
 */
export const STUDIO_VIEW_CONFIG: Record<StudioViewKey, { 
  label: string; 
  order: number;
  description: string;
}> = {
  driver_side: { 
    label: 'Driver Side', 
    order: 1,
    description: '45° front-left three-quarter view'
  },
  front: { 
    label: 'Front', 
    order: 2,
    description: 'Straight-on front view, slightly elevated'
  },
  rear: { 
    label: 'Rear', 
    order: 3,
    description: 'Straight-on rear view, slightly elevated'
  },
  passenger_side: { 
    label: 'Passenger Side', 
    order: 4,
    description: '45° front-right three-quarter view'
  },
  top: { 
    label: 'Top', 
    order: 5,
    description: 'Overhead drone-style view'
  },
  detail: { 
    label: 'Detail', 
    order: 6,
    description: 'Close-up of key design element'
  },
};

/**
 * RenderSpec version identifiers.
 * Each spec defines locked studio + camera + lighting.
 */
export type RenderSpecVersion = 'WPW_STUDIO_V1';

/**
 * PDF template version identifiers.
 * Each version defines exact layout, fonts, spacing.
 */
export type PdfTemplateVersion = 'PROOF_PDF_V1';

/**
 * Branding template version identifiers.
 * Each version defines overlay positions, fonts, colors.
 */
export type BrandingTemplateVersion = 'BRANDING_V1';

/**
 * Proof status lifecycle.
 * Once sent → changes require new revision.
 */
export type ProofStatus = 
  | 'draft'           // Being prepared by designer
  | 'sent'            // Delivered to customer
  | 'changes_requested' // Customer requested revisions
  | 'approved'        // Customer approved
  | 'superseded';     // Replaced by newer revision

/**
 * Proof event types for audit log.
 */
export type ProofEventType =
  | 'generated'       // Proof PDF created
  | 'sent'            // Email sent to customer
  | 'opened'          // Customer viewed proof
  | 'feedback'        // Customer left message
  | 'revised'         // New revision created
  | 'approved'        // Customer approved
  | 'deleted';        // Soft deleted

/**
 * Proof asset types.
 */
export type ProofAssetType =
  | 'render_image'    // Studio render output
  | 'source_upload'   // Original 2D design
  | 'atlas'           // Texture mapping
  | 'pdf';            // Generated proof PDF

/**
 * Validation result from server-side gate.
 */
export interface ValidationResult {
  ok: boolean;
  missing: string[];
  spec_version: RenderSpecVersion;
  checks: {
    all_views_present: boolean;
    no_invalid_keys: boolean;
    spec_version_matches: boolean;
  };
  invalid_reason: string | null;
}

/**
 * Proof artifact with full metadata.
 */
export interface ProofArtifact {
  id: string;
  project_id: string;
  revision: number;
  render_job_id: string | null;
  render_spec_version: RenderSpecVersion;
  pdf_template_version: PdfTemplateVersion;
  branding_template_version: BrandingTemplateVersion;
  pdf_url: string | null;
  status: ProofStatus;
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
}

/**
 * Proof asset linked to artifact.
 */
export interface ProofAsset {
  id: string;
  proof_id: string;
  asset_type: ProofAssetType;
  camera_id: StudioViewKey | null;
  url: string;
  created_at: string;
}

/**
 * Proof event for audit trail.
 */
export interface ProofEvent {
  id: string;
  proof_id: string;
  event_type: ProofEventType;
  actor: 'designer' | 'customer' | 'system';
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Studio render URLs keyed by canonical view keys.
 */
export type RenderUrlMap = Partial<Record<StudioViewKey, string>>;

/**
 * Helper to check if a key is a valid studio view key.
 */
export function isValidStudioViewKey(key: string): key is StudioViewKey {
  return STUDIO_VIEW_KEYS.includes(key as StudioViewKey);
}

/**
 * Get ordered views for display.
 */
export function getOrderedViews(): Array<{ key: StudioViewKey; label: string; order: number }> {
  return STUDIO_VIEW_KEYS
    .map(key => ({ key, ...STUDIO_VIEW_CONFIG[key] }))
    .sort((a, b) => a.order - b.order);
}
