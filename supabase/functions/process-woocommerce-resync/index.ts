// ============================================
// Process WooCommerce Resync — ApproveFlow
// ============================================
// This function processes order data fetched via woo-proxy
// from the frontend, avoiding Cloudflare blocking issues
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, orderData } = await req.json();

    if (!projectId || !orderData) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing projectId or orderData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ProcessResync] Processing order data for projectId: ${projectId}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current project state
    const { data: project, error: projectErr } = await supabase
      .from("approveflow_projects")
      .select("order_number, design_instructions, vehicle_info")
      .eq("id", projectId)
      .single();

    if (projectErr || !project) {
      console.error("[ProcessResync] Project not found", projectErr);
      return new Response(
        JSON.stringify({ success: false, error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = orderData;
    console.log(`[ProcessResync] Processing order #${order.number || project.order_number} with ${order.line_items?.length || 0} line items`);

    // Extract data from line_items[].meta_data (WooCommerce Extra Product Options)
    let designInstructions = "";
    const fileUrls: { url: string; filename: string; fileType: string }[] = [];
    let vehicleInfo: { year?: string; make?: string; model?: string } = {};

    // Collect all text values for design instructions
    const instructionParts: string[] = [];
    
    // Iterate through all line items and their meta_data
    for (const item of order.line_items || []) {
      console.log(`[ProcessResync] Processing line item: ${item.name}`);
      
      for (const meta of item.meta_data || []) {
        const key = (meta.key || "").toLowerCase();
        const displayKey = meta.display_key || meta.key || "";
        const value = meta.display_value || meta.value || "";
        
        // Log all meta for debugging
        console.log(`[ProcessResync] Meta: key="${meta.key}", display_key="${displayKey}", value_preview="${String(value).substring(0, 100)}..."`);
        
        // Skip internal WooCommerce fields
        if (key.startsWith("_") || key.startsWith("pa_")) continue;
        
        // WooCommerce Extra Product Options stores customer text in various ways
        // Check if this is a meaningful text field (not just a product option label)
        const valueStr = String(value);
        
        // Design instructions - look for common field patterns OR any long text response
        const isInstructionField = 
          key.includes("describe") ||
          key.includes("design") ||
          key.includes("project") ||
          key.includes("instructions") ||
          key.includes("notes") ||
          key.includes("details") ||
          key.includes("requirements") ||
          key.includes("information") ||
          key.includes("please") ||
          displayKey.toLowerCase().includes("describe") ||
          displayKey.toLowerCase().includes("project") ||
          displayKey.toLowerCase().includes("information");
        
        // Also capture any substantial text that looks like customer input
        // (more than 50 chars and contains spaces = likely a description)
        const isLongCustomerText = valueStr.length > 50 && valueStr.includes(" ") && !valueStr.startsWith("http");
        
        if (isInstructionField || isLongCustomerText) {
          if (valueStr.length > 10) {
            instructionParts.push(valueStr);
            console.log(`[ProcessResync] Found instruction text (${valueStr.length} chars): "${valueStr.substring(0, 80)}..."`);
          }
        }

        // File uploads - extract URLs
        if (key.includes("file") || key.includes("upload") || key.includes("logo") || key.includes("artwork")) {
          const urlMatch = String(value).match(/https?:\/\/[^\s<>"']+/);
          if (urlMatch) {
            const url = urlMatch[0];
            const filename = url.split("/").pop()?.split("?")[0] || "customer_file";
            const extension = filename.split(".").pop()?.toLowerCase() || "";
            
            let fileType = "customer_upload";
            if (key.includes("logo")) fileType = "customer_logo";
            else if (key.includes("brand")) fileType = "customer_brand_guide";
            else if (extension === "ai" || extension === "eps" || extension === "pdf") fileType = "customer_design_file";
            
            fileUrls.push({ url, filename, fileType });
            console.log(`[ProcessResync] Found file: ${filename} (${fileType})`);
          }
        }

        // Vehicle info
        if (key.includes("year") || displayKey.toLowerCase().includes("year")) {
          const yearMatch = String(value).match(/\d{4}/);
          if (yearMatch) vehicleInfo.year = yearMatch[0];
        }
        if (key.includes("make") || displayKey.toLowerCase().includes("make")) {
          if (typeof value === "string" && value.length > 1 && value.length < 50) {
            vehicleInfo.make = value;
          }
        }
        if (key.includes("model") || displayKey.toLowerCase().includes("model")) {
          if (typeof value === "string" && value.length > 1 && value.length < 100) {
            vehicleInfo.model = value;
          }
        }
      }
    }

    // Also check order-level meta_data
    for (const meta of order.meta_data || []) {
      const key = (meta.key || "").toLowerCase();
      const value = meta.value || "";

      if (key.includes("year")) {
        const yearMatch = String(value).match(/\d{4}/);
        if (yearMatch && !vehicleInfo.year) vehicleInfo.year = yearMatch[0];
      }
      if (key.includes("make") && !vehicleInfo.make) {
        if (typeof value === "string" && value.length > 1 && value.length < 50) {
          vehicleInfo.make = value;
        }
      }
      if (key.includes("model") && !vehicleInfo.model) {
        if (typeof value === "string" && value.length > 1 && value.length < 100) {
          vehicleInfo.model = value;
        }
      }
    }

    // Combine all instruction parts into one string
    if (instructionParts.length > 0) {
      designInstructions = instructionParts.join("\n\n");
    }

    console.log(`[ProcessResync] Extracted: instructions=${designInstructions.length} chars, files=${fileUrls.length}, vehicle=${JSON.stringify(vehicleInfo)}`);

    // Track what was synced
    const synced = {
      designInstructions: false,
      vehicleInfo: null as { year?: string; make?: string; model?: string } | null,
      filesCount: 0,
    };

    // Update approveflow_projects if fields are empty
    const updates: Record<string, any> = {};
    
    if (designInstructions && (!project.design_instructions || project.design_instructions.trim().length === 0)) {
      updates.design_instructions = designInstructions;
      synced.designInstructions = true;
    }

    const existingVehicle = project.vehicle_info as any || {};
    if (Object.keys(vehicleInfo).length > 0) {
      const mergedVehicle = {
        year: existingVehicle.year || vehicleInfo.year,
        make: existingVehicle.make || vehicleInfo.make,
        model: existingVehicle.model || vehicleInfo.model,
      };
      
      if (
        (vehicleInfo.year && !existingVehicle.year) ||
        (vehicleInfo.make && !existingVehicle.make) ||
        (vehicleInfo.model && !existingVehicle.model)
      ) {
        updates.vehicle_info = mergedVehicle;
        synced.vehicleInfo = vehicleInfo;
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { error: updateErr } = await supabase
        .from("approveflow_projects")
        .update(updates)
        .eq("id", projectId);

      if (updateErr) {
        console.error("[ProcessResync] Failed to update project", updateErr);
      } else {
        console.log("[ProcessResync] Updated project with:", Object.keys(updates));
      }
    }

    // Insert new assets (with deduplication)
    for (const file of fileUrls) {
      const { data: existing } = await supabase
        .from("approveflow_assets")
        .select("id")
        .eq("project_id", projectId)
        .eq("file_url", file.url)
        .maybeSingle();

      if (existing) {
        console.log(`[ProcessResync] Asset already exists: ${file.filename}`);
        continue;
      }

      const { error: insertErr } = await supabase
        .from("approveflow_assets")
        .insert({
          project_id: projectId,
          file_url: file.url,
          file_type: file.fileType,
          original_filename: file.filename,
          source: "woocommerce",
          visibility: "internal",
        });

      if (insertErr) {
        console.error(`[ProcessResync] Failed to insert asset: ${file.filename}`, insertErr);
      } else {
        synced.filesCount++;
        console.log(`[ProcessResync] Inserted asset: ${file.filename}`);
      }
    }

    // Build summary message
    const parts: string[] = [];
    if (synced.filesCount > 0) parts.push(`${synced.filesCount} file${synced.filesCount > 1 ? "s" : ""}`);
    if (synced.designInstructions) parts.push("design instructions");
    if (synced.vehicleInfo) parts.push("vehicle info");
    
    const message = parts.length > 0 
      ? `Synced: ${parts.join(", ")}`
      : "No new data found to sync";

    console.log(`[ProcessResync] Complete: ${message}`);

    return new Response(
      JSON.stringify({
        success: true,
        orderNumber: order.number || project.order_number,
        synced,
        message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ProcessResync] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
