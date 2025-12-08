import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();
    console.log("Creating ZIP for project:", project_id);

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load project
    const { data: project, error: projectError } = await supabase
      .from("approveflow_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load assets
    const { data: assets } = await supabase
      .from("approveflow_assets")
      .select("*")
      .eq("project_id", project_id)
      .order("sort_order", { ascending: true });

    const proofAssets = assets?.filter(a => a.view_type) || [];

    if (proofAssets.length === 0) {
      return new Response(
        JSON.stringify({ error: "No proof images to export" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const zip = new JSZip();
    const vehicleInfo = project.vehicle_info || {};

    // Add images to ZIP
    for (const asset of proofAssets) {
      try {
        const imgResponse = await fetch(asset.file_url);
        if (!imgResponse.ok) {
          console.error("Failed to fetch image:", asset.file_url);
          continue;
        }
        
        const imgBuffer = await imgResponse.arrayBuffer();
        const ext = asset.file_url.split('.').pop()?.split('?')[0] || 'png';
        const fileName = `${asset.view_type || 'view'}.${ext}`;
        
        zip.file(fileName, imgBuffer);
        console.log("Added to ZIP:", fileName);
      } catch (imgError) {
        console.error("Error adding image to ZIP:", imgError);
      }
    }

    // Add metadata JSON
    const metadata = {
      project_id: project.id,
      order_number: project.order_number,
      customer_name: project.customer_name,
      customer_email: project.customer_email,
      vehicle: {
        year: vehicleInfo.year,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
      },
      product_type: project.product_type,
      design_instructions: project.design_instructions,
      version: project.current_version || 1,
      status: project.status,
      generated_at: new Date().toISOString(),
      asset_count: proofAssets.length,
      views: proofAssets.map(a => a.view_type),
    };

    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // Generate ZIP
    const zipContent = await zip.generateAsync({ 
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    console.log("ZIP generated, size:", zipContent.length);

    // Upload to storage
    const fileName = `proofs/${project_id}/proof_v${project.current_version || 1}_${Date.now()}.zip`;
    
    const { error: uploadError } = await supabase.storage
      .from("approveflow-files")
      .upload(fileName, zipContent, {
        contentType: "application/zip",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("approveflow-files")
      .getPublicUrl(fileName);

    console.log("ZIP uploaded:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: urlData.publicUrl,
        filename: `proof-${project.order_number}-v${project.current_version || 1}.zip`,
        asset_count: proofAssets.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ZIP export error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "ZIP generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
