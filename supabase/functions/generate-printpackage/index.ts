import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { panelUrl, widthIn, heightIn } = await req.json();

    if (!panelUrl || !widthIn || !heightIn) {
      throw new Error("Missing required fields: panelUrl, widthIn, heightIn");
    }

    const DPI = 300;
    const BLEED_IN = 0.25;

    const widthPx = Math.floor((widthIn + BLEED_IN * 2) * DPI);
    const heightPx = Math.floor((heightIn + BLEED_IN * 2) * DPI);

    console.log("Creating print package:", { widthIn, heightIn, widthPx, heightPx });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch original panel
    const imgResponse = await fetch(panelUrl);
    if (!imgResponse.ok) throw new Error("Failed to fetch panel image");
    
    const imgBuf = await imgResponse.arrayBuffer();
    const filename = `print-packages/panel-${Date.now()}.png`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("design-vault")
      .upload(filename, imgBuf, { 
        upsert: true,
        contentType: 'image/png'
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("design-vault")
      .getPublicUrl(filename);

    const metadata = {
      width_in: widthIn,
      height_in: heightIn,
      bleed_in: BLEED_IN,
      dpi: DPI,
      width_px: widthPx,
      height_px: heightPx,
      file: filename,
      url: urlData.publicUrl,
      created_at: new Date().toISOString()
    };

    console.log("Print package created successfully:", filename);

    return new Response(JSON.stringify({
      print_url: urlData.publicUrl,
      metadata
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("generate-printpackage error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
