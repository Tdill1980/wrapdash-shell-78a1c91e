import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DesignRequest {
  organization_id: string;
  contact_id?: string;
  vehicle: {
    year: string;
    make: string;
    model: string;
  };
  style: "luxury" | "camo" | "abstract" | "corporate" | "gradient" | "bold" | "custom";
  notes?: string;
  customer_name?: string;
  customer_email?: string;
}

// Generate AI image using Lovable AI gateway
async function generateDesignImage(prompt: string): Promise<string | null> {
  if (!LOVABLE_API_KEY) {
    console.log("No LOVABLE_API_KEY, skipping image generation");
    return null;
  }

  try {
    console.log("Generating image with prompt:", prompt.substring(0, 100) + "...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: prompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log("Image generated successfully");
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

// Upload base64 image to Supabase storage
async function uploadImageToStorage(
  supabase: any,
  base64Data: string,
  fileName: string
): Promise<string | null> {
  try {
    // Extract base64 content (remove data:image/png;base64, prefix)
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    const filePath = `designs/${Date.now()}-${fileName}.png`;
    
    const { data, error } = await supabase.storage
      .from("approveflow-files")
      .upload(filePath, imageBytes, {
        contentType: "image/png",
        upsert: false
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from("approveflow-files")
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: DesignRequest = await req.json();
    const { organization_id, contact_id, vehicle, style, notes, customer_name, customer_email } = payload;

    console.log("AI Design Request:", { organization_id, vehicle, style, notes });

    if (!vehicle?.make || !vehicle?.model) {
      return new Response(
        JSON.stringify({ error: "Vehicle make and model are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load TradeDNA for brand voice (optional)
    let brandVoice = "professional and enthusiastic wrap shop";
    try {
      const { data: tradeDNA } = await supabase
        .from("organization_tradedna")
        .select("tradedna_profile")
        .eq("organization_id", organization_id)
        .single();
      
      if (tradeDNA?.tradedna_profile?.brand_voice?.tone) {
        brandVoice = tradeDNA.tradedna_profile.brand_voice.tone.join(", ");
      }
    } catch (e) {
      console.log("No TradeDNA found, using defaults");
    }

    // Generate design concept description using AI
    const designPrompt = `You are a professional vehicle wrap designer. Create a compelling design concept description for:

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Style: ${style}
${notes ? `Customer Notes: ${notes}` : ""}

Provide a JSON response with:
{
  "design_title": "catchy name for this design concept",
  "design_description": "2-3 sentences describing the wrap design concept, colors, patterns, and visual impact",
  "color_palette": ["primary color", "secondary color", "accent color"],
  "design_elements": ["element1", "element2", "element3"],
  "ai_message": "friendly message to customer about their design preview being ready"
}

Keep the tone ${brandVoice}. Make it exciting and visual.`;

    let designConcept = {
      design_title: `${style.charAt(0).toUpperCase() + style.slice(1)} ${vehicle.make} Wrap`,
      design_description: `A stunning ${style} wrap design for your ${vehicle.year} ${vehicle.make} ${vehicle.model}, featuring dynamic color transitions and professional finishing.`,
      color_palette: ["Deep Black", "Electric Blue", "Silver Metallic"],
      design_elements: ["Color fade", "Accent stripes", "Matte finish sections"],
      ai_message: `Your ${style} wrap concept for the ${vehicle.year} ${vehicle.make} ${vehicle.model} is ready! Take a look and let us know what you think.`
    };

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a creative vehicle wrap designer. Always respond with valid JSON." },
              { role: "user", content: designPrompt }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "create_design_concept",
                  description: "Create a vehicle wrap design concept",
                  parameters: {
                    type: "object",
                    properties: {
                      design_title: { type: "string" },
                      design_description: { type: "string" },
                      color_palette: { type: "array", items: { type: "string" } },
                      design_elements: { type: "array", items: { type: "string" } },
                      ai_message: { type: "string" }
                    },
                    required: ["design_title", "design_description", "color_palette", "design_elements", "ai_message"]
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "create_design_concept" } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            designConcept = JSON.parse(toolCall.function.arguments);
          }
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
      }
    }

    // Generate AI images
    const previewImages: string[] = [];
    
    // Generate 2D concept image
    const conceptPrompt = `Professional 2D vehicle wrap concept art for a ${vehicle.year} ${vehicle.make} ${vehicle.model}. ${style} style design with ${designConcept.color_palette.join(", ")} colors. ${designConcept.design_elements.join(", ")}. High contrast, professional automotive graphics, clean lines, marketing-ready visualization. Ultra high resolution.`;
    
    const conceptImageBase64 = await generateDesignImage(conceptPrompt);
    if (conceptImageBase64) {
      const conceptUrl = await uploadImageToStorage(supabase, conceptImageBase64, "concept-2d");
      if (conceptUrl) {
        previewImages.push(conceptUrl);
        console.log("2D concept uploaded:", conceptUrl);
      }
    }

    // Generate 3D preview image
    const preview3DPrompt = `Photorealistic 3D render of a ${vehicle.year} ${vehicle.make} ${vehicle.model} with a ${style} vehicle wrap. ${designConcept.color_palette.join(", ")} color scheme. Professional automotive photography, studio lighting, glossy finish, front 3/4 angle. Ultra high resolution.`;
    
    const preview3DBase64 = await generateDesignImage(preview3DPrompt);
    if (preview3DBase64) {
      const preview3DUrl = await uploadImageToStorage(supabase, preview3DBase64, "preview-3d");
      if (preview3DUrl) {
        previewImages.push(preview3DUrl);
        console.log("3D preview uploaded:", preview3DUrl);
      }
    }

    // Generate order number for ApproveFlow
    const orderNumber = `AF-${Date.now().toString(36).toUpperCase()}`;

    // Create ApproveFlow project
    const { data: project, error: projectError } = await supabase
      .from("approveflow_projects")
      .insert({
        customer_name: customer_name || "Design Preview",
        customer_email: customer_email || null,
        order_number: orderNumber,
        product_type: `${style} Wrap - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        status: "design_requested",
        organization_id,
        vehicle_info: vehicle,
        design_instructions: `Style: ${style}\n${notes || ""}`,
      })
      .select()
      .single();

    if (projectError) {
      console.error("ApproveFlow project creation error:", projectError);
      throw projectError;
    }

    console.log("Created ApproveFlow project:", project.id);

    // Add initial chat message with design concept
    await supabase.from("approveflow_chat").insert({
      project_id: project.id,
      sender: "designer",
      message: `🎨 **Design Concept: ${designConcept.design_title}**\n\n${designConcept.design_description}\n\n**Color Palette:** ${designConcept.color_palette.join(", ")}\n\n**Design Elements:** ${designConcept.design_elements.join(", ")}\n\nLet us know your thoughts!`,
    });

    // Add design preview images as assets if generated
    if (previewImages.length > 0) {
      const assetInserts = previewImages.map((url, index) => ({
        project_id: project.id,
        file_url: url,
        file_type: index === 0 ? "2d_concept" : "3d_preview",
      }));
      
      await supabase.from("approveflow_assets").insert(assetInserts);

      // Add images message to chat
      await supabase.from("approveflow_chat").insert({
        project_id: project.id,
        sender: "system",
        message: `📸 **Design Previews Generated**\n\n${previewImages.map((url, i) => `[${i === 0 ? '2D Concept' : '3D Preview'}](${url})`).join("\n")}`,
      });
    }

    // Update workspace AI memory if contact_id provided
    if (contact_id) {
      await supabase
        .from("workspace_ai_memory")
        .upsert({
          organization_id,
          contact_id,
          last_design_style: style,
          last_design_preview_urls: previewImages,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,contact_id"
        });
    }

    // Create AI action for MCP visibility
    await supabase.from("ai_actions").insert({
      organization_id,
      action_type: "design_ready",
      action_payload: {
        contact_id,
        approveflow_id: project.id,
        design_title: designConcept.design_title,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        preview_images: previewImages,
      },
      priority: "high",
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        approveflow_id: project.id,
        order_number: orderNumber,
        design_concept: {
          ...designConcept,
          preview_images: previewImages,
        },
        ai_message: designConcept.ai_message,
        portal_url: `/customer/${project.id}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate design";
    console.error("AI Design Generation error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});