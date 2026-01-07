// supabase/functions/validate-approveflow-proof/index.ts
// ============================================
// ApproveFlow OS Gate - Server-Side Validation
// ============================================
// This function is the AUTHORITATIVE gate for approval.
// UI cannot bypass this. All requirements must pass.
// Uses canonical StudioViewKey types from approveflow-os.ts
// ============================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// CANONICAL VIEW KEYS - HARD LOCKED
// These MUST match src/types/approveflow-os.ts
// ============================================
const CANONICAL_VIEW_KEYS = [
  'driver_side',
  'passenger_side',
  'front',
  'rear',
  'top',
  'detail'
] as const;

type CanonicalViewKey = typeof CANONICAL_VIEW_KEYS[number];

// Current render spec version
const CURRENT_RENDER_SPEC = 'WPW_STUDIO_V1';

type MissingItem =
  | "order_number"
  | "vehicle_year"
  | "vehicle_make"
  | "vehicle_model"
  | "total_sq_ft"
  | "wrap_scope"
  | "views_driver_side"
  | "views_passenger_side"
  | "views_front"
  | "views_rear"
  | "views_top"
  | "views_detail"
  | "proof_not_found";

interface ValidationResult {
  ok: boolean;
  missing: MissingItem[];
  proof_version_id?: string;
  status?: string;
  render_spec_version: string;
  checks: {
    all_views_present: boolean;
    no_invalid_keys: boolean;
    spec_version_matches: boolean;
    all_required_fields: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proof_version_id } = await req.json();
    
    if (!proof_version_id) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "proof_version_id is required",
          missing: [],
          render_spec_version: CURRENT_RENDER_SPEC,
          checks: {
            all_views_present: false,
            no_invalid_keys: true,
            spec_version_matches: true,
            all_required_fields: false
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[validate-approveflow-proof] Validating proof: ${proof_version_id}`);
    console.log(`[validate-approveflow-proof] Using render spec: ${CURRENT_RENDER_SPEC}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch proof version
    const { data: pv, error: pvErr } = await supabase
      .from("approveflow_proof_versions")
      .select("*")
      .eq("id", proof_version_id)
      .single();

    if (pvErr || !pv) {
      console.error(`[validate-approveflow-proof] Proof not found: ${pvErr?.message}`);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          missing: ["proof_not_found"],
          error: pvErr?.message || "Proof version not found",
          render_spec_version: CURRENT_RENDER_SPEC,
          checks: {
            all_views_present: false,
            no_invalid_keys: true,
            spec_version_matches: true,
            all_required_fields: false
          }
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const missing: MissingItem[] = [];

    // ============================================
    // REQUIRED FIELDS CHECK (Approval-Blocking)
    // ============================================

    // Order number (should always exist, but verify)
    if (!pv.order_number) {
      missing.push("order_number");
    }

    // Vehicle identity fields
    if (!pv.vehicle_year) {
      missing.push("vehicle_year");
    }
    if (!pv.vehicle_make) {
      missing.push("vehicle_make");
    }
    if (!pv.vehicle_model) {
      missing.push("vehicle_model");
    }

    // CRITICAL: Total SQ FT is REQUIRED - blocks approval if missing
    if (pv.total_sq_ft === null || pv.total_sq_ft === undefined) {
      missing.push("total_sq_ft");
    }

    // CRITICAL: Wrap scope is REQUIRED - blocks approval if missing
    if (!pv.wrap_scope) {
      missing.push("wrap_scope");
    }

    const all_required_fields = missing.length === 0;

    // ============================================
    // REQUIRED VIEWS CHECK (All 6 canonical views)
    // ============================================

    const { data: views, error: viewsErr } = await supabase
      .from("approveflow_proof_views")
      .select("view_key")
      .eq("proof_version_id", proof_version_id);

    if (viewsErr) {
      console.error(`[validate-approveflow-proof] Error fetching views: ${viewsErr.message}`);
      throw new Error(viewsErr.message);
    }

    const existingViews = new Set((views || []).map((v) => v.view_key));
    const invalidKeys: string[] = [];
    
    // Check each canonical view key (HARD LOCKED)
    for (const viewKey of CANONICAL_VIEW_KEYS) {
      // Also check legacy keys for backwards compatibility
      const legacyKey = viewKey.replace('_side', ''); // driver_side -> driver
      const hasView = existingViews.has(viewKey) || existingViews.has(legacyKey);
      
      if (!hasView) {
        missing.push(`views_${viewKey}` as MissingItem);
      }
    }

    // Check for invalid keys (non-canonical)
    for (const view of views || []) {
      const key = view.view_key;
      const isCanonical = CANONICAL_VIEW_KEYS.includes(key as CanonicalViewKey);
      const isLegacy = ['driver', 'passenger'].includes(key); // Legacy keys still accepted
      
      if (!isCanonical && !isLegacy) {
        invalidKeys.push(key);
      }
    }

    const all_views_present = !missing.some(m => m.startsWith('views_'));
    const no_invalid_keys = invalidKeys.length === 0;

    // Log any invalid keys found
    if (invalidKeys.length > 0) {
      console.warn(`[validate-approveflow-proof] Invalid view keys found: ${invalidKeys.join(', ')}`);
    }

    // ============================================
    // RESULT
    // ============================================

    const ok = missing.length === 0 && no_invalid_keys;

    console.log(`[validate-approveflow-proof] Validation result: ok=${ok}`);
    console.log(`[validate-approveflow-proof] Missing: ${missing.join(', ') || 'none'}`);
    console.log(`[validate-approveflow-proof] Invalid keys: ${invalidKeys.join(', ') || 'none'}`);

    const result: ValidationResult = {
      ok,
      missing,
      proof_version_id,
      status: pv.status,
      render_spec_version: CURRENT_RENDER_SPEC,
      checks: {
        all_views_present,
        no_invalid_keys,
        spec_version_matches: true, // Always true when using this validator
        all_required_fields
      }
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error(`[validate-approveflow-proof] Error:`, e);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        missing: [],
        error: e instanceof Error ? e.message : "Unknown error",
        render_spec_version: CURRENT_RENDER_SPEC,
        checks: {
          all_views_present: false,
          no_invalid_keys: true,
          spec_version_matches: true,
          all_required_fields: false
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
