import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { panelUrl, vehicleModel } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const prompt = `Generate a hyper-realistic 3D vehicle wrap render.

Vehicle: ${vehicleModel}
Studio: dark concrete studio, high-end lighting
Camera: front 3/4 angle
Apply wrap exactly from provided image.
Show real reflections and body lines.
No distortion, no fisheye, no cartoon style.`;

    console.log("Generating 3D render for vehicle:", vehicleModel);

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
