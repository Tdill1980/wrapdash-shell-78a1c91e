import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { panelUrl, vehicleModel } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Generate a photorealistic 3D vehicle wrap render.

Vehicle: ${vehicleModel}
Apply the provided wrap panel design to the vehicle body.

Requirements:
- Professional automotive photography style
- Dark studio environment with dramatic lighting
- Front 3/4 camera angle showing vehicle and wrap design
- High-end commercial quality
- Show the wrap texture and design clearly
- Realistic reflections and material properties
- Studio-grade lighting setup

Create a premium vehicle wrap visualization that showcases the design on the vehicle.`;

    console.log("Generating 3D render for vehicle:", vehicleModel);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: panelUrl
                }
              }
            ]
          }
        ],
        modalities: ["image"]
      })
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("AI API error:", aiRes.status, errorText);
      throw new Error(`3D generation failed: ${errorText}`);
    }

    const aiData = await aiRes.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No 3D render generated");
    }

    return new Response(JSON.stringify({
      render: imageUrl
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error('Error in generate-3d:', error);
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
