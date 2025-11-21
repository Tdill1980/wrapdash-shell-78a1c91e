import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { panelUrl, width, height } = await req.json();

    console.log("Converting to print-ready format:", { width, height });

    // Calculate print dimensions at 300 DPI
    const printWidth = Math.floor(Number(width) * 300);
    const printHeight = Math.floor(Number(height) * 300);

    console.log("Print dimensions (pixels):", { printWidth, printHeight });

    // Fetch the base64 image
    let imageBuffer: Uint8Array;
    if (panelUrl.startsWith("data:")) {
      const imageData = panelUrl.split(",")[1];
      imageBuffer = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));
    } else {
      // If it's a URL, fetch it
      const response = await fetch(panelUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = new Uint8Array(arrayBuffer);
    }

    // For now, we'll store the original high-res image as PNG
    // In production, you'd use a proper image processing library to:
    // 1. Resize to exact printWidth x printHeight
    // 2. Convert to CMYK color space
    // 3. Apply LZW compression
    // 4. Add bleed and safety margins
    // 5. Save as TIFF format

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const filename = `panel-print-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("design-vault")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("design-vault")
      .getPublicUrl(filename);

    console.log("Print file uploaded:", urlData.publicUrl);

    return new Response(
      JSON.stringify({
        tiffUrl: urlData.publicUrl,
        dimensions: {
          width: printWidth,
          height: printHeight,
          dpi: 300
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error in convert-print:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
