// supabase/functions/approve-approveflow-proof/index.ts
// ============================================
// ApproveFlow Approval Lock - Freeze Proof Forever
// ============================================
// This function locks the proof permanently after customer approval.
// Once approved, the proof is IMMUTABLE - no further edits allowed.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proof_version_id, customer_name, customer_signature } = await req.json();

    if (!proof_version_id) {
      return new Response(
        JSON.stringify({ success: false, error: "proof_version_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[approve-approveflow-proof] Approving proof: ${proof_version_id}`);

    const supabase = createClient(
      Deno.env.get("EXTERNAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch current proof version
    const { data: pv, error: pvErr } = await supabase
      .from("approveflow_proof_versions")
      .select("status, proof_pdf_url, project_id, order_number")
      .eq("id", proof_version_id)
      .single();

    if (pvErr || !pv) {
      console.error(`[approve-approveflow-proof] Proof not found: ${pvErr?.message}`);
      return new Response(
        JSON.stringify({ success: false, error: pvErr?.message || "Proof not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already approved? Return success (idempotent)
    if (pv.status === "approved") {
      console.log(`[approve-approveflow-proof] Proof already approved`);
      return new Response(
        JSON.stringify({ success: true, status: "approved", message: "Proof was already approved" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VALIDATION: PDF must exist before approval
    // ============================================
    if (!pv.proof_pdf_url) {
      console.error(`[approve-approveflow-proof] Cannot approve: PDF not generated`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Proof PDF must be generated before approval. Call generate-approveflow-proof-pdf first." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VALIDATION: Status must be 'ready' or 'sent'
    // ============================================
    if (!['ready', 'sent'].includes(pv.status)) {
      console.error(`[approve-approveflow-proof] Cannot approve: Invalid status ${pv.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Cannot approve proof in '${pv.status}' status. Status must be 'ready' or 'sent'.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // LOCK THE PROOF - Set status to 'approved'
    // ============================================
    const approvedAt = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("approveflow_proof_versions")
      .update({
        status: "approved",
        approved_at: approvedAt
      })
      .eq("id", proof_version_id);

    if (updateErr) {
      console.error(`[approve-approveflow-proof] Failed to update proof:`, updateErr);
      throw new Error(updateErr.message);
    }

    console.log(`[approve-approveflow-proof] Proof approved successfully at ${approvedAt}`);

    // ============================================
    // UPDATE LINKED PROJECT STATUS (if applicable)
    // ============================================
    if (pv.project_id) {
      const { error: projectErr } = await supabase
        .from("approveflow_projects")
        .update({
          status: "approved",
          updated_at: approvedAt
        })
        .eq("id", pv.project_id);

      if (projectErr) {
        console.error(`[approve-approveflow-proof] Failed to update project status:`, projectErr);
        // Don't throw - proof is already approved
      } else {
        console.log(`[approve-approveflow-proof] Project ${pv.project_id} marked as approved`);
      }

      // Log the approval action
      await supabase
        .from("approveflow_actions")
        .insert({
          project_id: pv.project_id,
          action_type: "design_approved",
          payload: {
            proof_version_id,
            approved_at: approvedAt,
            customer_name: customer_name || null,
            pdf_url: pv.proof_pdf_url
          }
        });

      // Send team notification email
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        
        await fetch(`${supabaseUrl}/functions/v1/notify-approveflow-team`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            projectId: pv.project_id,
            notificationType: 'approved',
            customerName: customer_name || 'Customer',
            orderNumber: pv.order_number,
          }),
        });
        console.log(`[approve-approveflow-proof] Team notification sent for order ${pv.order_number}`);
      } catch (notifyErr) {
        console.error(`[approve-approveflow-proof] Failed to send team notification:`, notifyErr);
        // Don't throw - approval is already complete
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: "approved",
        approved_at: approvedAt,
        pdf_url: pv.proof_pdf_url
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error(`[approve-approveflow-proof] Error:`, e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
