// ============================================
// Resync WooCommerce Order — ApproveFlow
// ============================================
// OS RULES:
// 1. Accepts projectId, resolves order_number internally
// 2. Fetches complete order data from WooCommerce REST API
// 3. Extracts design instructions, files, vehicle info from line_items[].meta_data
// 4. Updates approveflow_projects and creates approveflow_assets
// 5. Only fills empty fields, never overwrites existing data
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
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ResyncWC] Starting resync for projectId: ${projectId}`);

    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const WOO_CONSUMER_KEY = Deno.env.get("WOO_CONSUMER_KEY");
    const WOO_CONSUMER_SECRET = Deno.env.get("WOO_CONSUMER_SECRET");
    const WOO_STORE_URL = "https://weprintwraps.com";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }
    if (!WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
      throw new Error("Missing WooCommerce credentials");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 🔒 OS RULE: Resolve order_number from source of truth (approveflow_projects)
    const { data: project, error: projectErr } = await supabase
      .from("approveflow_projects")
      .select("order_number, design_instructions, vehicle_info")
      .eq("id", projectId)
      .single();

    if (projectErr || !project?.order_number) {
      console.error("[ResyncWC] Project not found or missing order_number", projectErr);
      return new Response(
        JSON.stringify({ success: false, error: "Project not found or missing order number" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderNumber = project.order_number;
    console.log(`[ResyncWC] Resolved order_number: ${orderNumber}`);

    // Fetch order from WooCommerce REST API
    const authString = btoa(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`);
    const wcUrl = `${WOO_STORE_URL}/wp-json/wc/v3/orders?number=${orderNumber}`;
    
    console.log(`[ResyncWC] Fetching from WooCommerce: ${wcUrl}`);
    
    const wcResponse = await fetch(wcUrl, {
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/json",
      },
    });

    if (!wcResponse.ok) {
      const errorText = await wcResponse.text();
      console.error(`[ResyncWC] WooCommerce API error: ${wcResponse.status}`, errorText);
      throw new Error(`WooCommerce API error: ${wcResponse.status}`);
    }

    const orders = await wcResponse.json();
    
    if (!orders || orders.length === 0) {
      console.log(`[ResyncWC] Order #${orderNumber} not found in WooCommerce`);
      return new Response(
        JSON.stringify({ success: false, error: `Order #${orderNumber} not found in WooCommerce` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = orders[0];
    console.log(`[ResyncWC] Found order with ${order.line_items?.length || 0} line items`);

    // Extract data from line_items[].meta_data (WooCommerce Extra Product Options)
    let designInstructions = "";
    const fileUrls: { url: string; filename: string; fileType: string }[] = [];
    let vehicleInfo: { year?: string; make?: string; model?: string } = {};

    // Iterate through all line items and their meta_data
    for (const item of order.line_items || []) {
      console.log(`[ResyncWC] Processing line item: ${item.name}`);
      
      for (const meta of item.meta_data || []) {
        const key = (meta.key || "").toLowerCase();
        const displayKey = meta.display_key || meta.key || "";
        const value = meta.display_value || meta.value || "";
        
        // Skip internal WooCommerce fields
        if (key.startsWith("_") || key.startsWith("pa_")) continue;
        
        // Design instructions - look for common field patterns
        if (
          key.includes("describe") ||
          key.includes("design") ||
          key.includes("project") ||
          key.includes("instructions") ||
          key.includes("notes") ||
          key.includes("details") ||
          key.includes("requirements")
        ) {
          if (typeof value === "string" && value.length > 20) {
            designInstructions = value;
            console.log(`[ResyncWC] Found design instructions (${value.length} chars)`);
          }
        }

        // File uploads - extract URLs
        if (key.includes("file") || key.includes("upload") || key.includes("logo") || key.includes("artwork")) {
          const urlMatch = String(value).match(/https?:\/\/[^\s<>"']+/);
          if (urlMatch) {
            const url = urlMatch[0];
            // Extract filename from URL
            const filename = url.split("/").pop()?.split("?")[0] || "customer_file";
            const extension = filename.split(".").pop()?.toLowerCase() || "";
            
            // Determine file type
            let fileType = "customer_upload";
            if (key.includes("logo")) fileType = "customer_logo";
            else if (key.includes("brand")) fileType = "customer_brand_guide";
            else if (extension === "ai" || extension === "eps" || extension === "pdf") fileType = "customer_design_file";
            
            fileUrls.push({ url, filename, fileType });
            console.log(`[ResyncWC] Found file: ${filename} (${fileType})`);
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

    console.log(`[ResyncWC] Extracted: instructions=${designInstructions.length} chars, files=${fileUrls.length}, vehicle=${JSON.stringify(vehicleInfo)}`);

    // Track what was synced
    const synced = {
      designInstructions: false,
      vehicleInfo: null as { year?: string; make?: string; model?: string } | null,
      filesCount: 0,
    };

    // Update approveflow_projects if fields are empty
    const updates: Record<string, any> = {};
    
    // Only update design_instructions if currently empty
    if (designInstructions && (!project.design_instructions || project.design_instructions.trim().length === 0)) {
      updates.design_instructions = designInstructions;
      synced.designInstructions = true;
    }

    // Only update vehicle_info if currently empty or incomplete
    const existingVehicle = project.vehicle_info as any || {};
    if (Object.keys(vehicleInfo).length > 0) {
      const mergedVehicle = {
        year: existingVehicle.year || vehicleInfo.year,
        make: existingVehicle.make || vehicleInfo.make,
        model: existingVehicle.model || vehicleInfo.model,
      };
      
      // Check if we added new info
      if (
        (vehicleInfo.year && !existingVehicle.year) ||
        (vehicleInfo.make && !existingVehicle.make) ||
        (vehicleInfo.model && !existingVehicle.model)
      ) {
        updates.vehicle_info = mergedVehicle;
        synced.vehicleInfo = vehicleInfo;
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { error: updateErr } = await supabase
        .from("approveflow_projects")
        .update(updates)
        .eq("id", projectId);

      if (updateErr) {
        console.error("[ResyncWC] Failed to update project", updateErr);
      } else {
        console.log("[ResyncWC] Updated project with:", Object.keys(updates));
      }
    }

    // Insert new assets (with deduplication)
    for (const file of fileUrls) {
      // Check if asset already exists
      const { data: existing } = await supabase
        .from("approveflow_assets")
        .select("id")
        .eq("project_id", projectId)
        .eq("file_url", file.url)
        .maybeSingle();

      if (existing) {
        console.log(`[ResyncWC] Asset already exists: ${file.filename}`);
        continue;
      }

      // Insert new asset
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
        console.error(`[ResyncWC] Failed to insert asset: ${file.filename}`, insertErr);
      } else {
        synced.filesCount++;
        console.log(`[ResyncWC] Inserted asset: ${file.filename}`);
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

    console.log(`[ResyncWC] Complete: ${message}`);

    return new Response(
      JSON.stringify({
        success: true,
        orderNumber,
        synced,
        message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ResyncWC] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
