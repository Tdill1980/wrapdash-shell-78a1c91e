import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { panelUrl, vehicleModelId, angle = 'front', finish = 'gloss', environment = 'studio' } = await req.json();

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

    console.log("Generating 3D render for:", vehicle.year, vehicle.make, vehicle.model, `(${angle}, ${finish}, ${environment})`);

    // Determine camera angle from vehicle data
    let cameraAngle = vehicle.angle_front || 'front 3/4 view, 45-degree angle';
    if (angle === 'side') cameraAngle = vehicle.angle_side || 'side profile view, 90-degree angle';
    if (angle === 'rear') cameraAngle = vehicle.angle_rear || 'rear 3/4 view, 45-degree angle';
    if (angle === 'front-close') cameraAngle = vehicle.angle_front_close || 'front close-up view, straight on';

    // Determine finish description
    const finishMap: Record<string, string> = {
      gloss: 'high-gloss finish with sharp reflections and mirror-like surface quality',
      satin: 'satin finish with soft reflections and smooth matte sheen',
      matte: 'matte finish with no reflections, deep rich color, flat surface appearance'
    };
    const finishDescription = finishMap[finish] || finishMap.gloss;

    // Determine environment description
    const environmentMap: Record<string, string> = {
      studio: 'dark concrete studio, professional lighting with soft shadows, clean modern backdrop',
      white: 'white cyclorama studio, bright even lighting, seamless white background',
      desert: 'desert landscape, golden hour lighting, sand dunes and dramatic sky',
      city: 'urban cityscape at night, neon lights, wet reflective pavement',
      garage: 'industrial garage, dramatic spot lighting, tool boxes and equipment in background',
      showroom: 'luxury showroom, spotlights, polished floor reflections, modern architecture'
    };
    const environmentDescription = environmentMap[environment] || environmentMap.studio;

    // Build prompt using vehicle data
    const prompt = `Generate a hyper-realistic 3D vehicle wrap render.

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Camera angle: ${cameraAngle}
Wrap finish: ${finishDescription}
Environment: ${environmentDescription}

Apply the wrap design from the provided panel image exactly as shown.
Show accurate body lines, panel gaps, and surface details.
The wrap should look professionally installed with no bubbles or imperfections.
Emphasize the ${finish} finish with appropriate lighting and reflections.
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
