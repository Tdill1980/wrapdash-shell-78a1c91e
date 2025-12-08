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

    // Add initial chat message
    await supabase.from("approveflow_chat").insert({
      project_id: project.id,
      sender: "designer",
      message: `🎨 **Design Concept: ${designConcept.design_title}**\n\n${designConcept.design_description}\n\n**Color Palette:** ${designConcept.color_palette.join(", ")}\n\n**Design Elements:** ${designConcept.design_elements.join(", ")}\n\nLet us know your thoughts!`,
    });

    // Update workspace AI memory if contact_id provided
    if (contact_id) {
      await supabase
        .from("workspace_ai_memory")
        .upsert({
          organization_id,
          contact_id,
          last_design_style: style,
          last_design_preview_urls: [],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,contact_id"
        });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        approveflow_id: project.id,
        order_number: orderNumber,
        design_concept: designConcept,
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
