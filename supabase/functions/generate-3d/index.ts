import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { panelUrl, vehicleModelId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Fetch vehicle data from database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicle_models")
      .select("*")
      .eq("id", vehicleModelId)
      .single();

    if (vehicleError || !vehicle) {
      console.error("Vehicle not found:", vehicleError);
      throw new Error("Vehicle not found in database");
    }

    console.log("Generating 3D render for:", vehicle.year, vehicle.make, vehicle.model);

    // Build prompt using vehicle data
    const prompt = `Generate a hyper-realistic 3D vehicle wrap render.

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Studio: dark concrete studio, high-end lighting
Camera: ${vehicle.angle_front || 'front 3/4 angle, 45-degree angle'}
Apply the wrap design from the provided panel image exactly as shown.
Show real reflections and body lines.
No distortion, no fisheye, no cartoon style.

${vehicle.render_prompt || 'Emphasize accurate vehicle proportions and wrap adhesion on body panels.'}`;

    const ai = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: panelUrl } }
              ]
            }
          ],
          modalities: ["image"]
        })
      }
    );

    if (!ai.ok) {
      const errorText = await ai.text();
      console.error("AI API error:", ai.status, errorText);
      throw new Error(`3D generation failed: ${errorText}`);
    }

    const json = await ai.json();
    const render = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!render) throw new Error("No 3D render returned");

    console.log("3D render generated successfully for:", vehicle.make, vehicle.model);

    return new Response(JSON.stringify({ render }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("generate-3d error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
