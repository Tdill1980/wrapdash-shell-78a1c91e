import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default SQFT estimates by vehicle class
const DEFAULT_SQFT: Record<string, number> = {
  coupe: 225,
  sedan: 265,
  suv: 310,
  truck: 330,
  van: 350,
  crossover: 285,
  hatchback: 240,
  wagon: 275,
  default: 280,
};

// Labor hours estimates by vehicle class
const LABOR_HOURS: Record<string, number> = {
  coupe: 16,
  sedan: 20,
  suv: 28,
  truck: 32,
  van: 36,
  crossover: 24,
  hatchback: 18,
  wagon: 22,
  default: 24,
};

// Wrap type multipliers
const WRAP_TYPE_MULTIPLIERS: Record<string, number> = {
  color_change: 1.0,
  printed: 1.15,
  commercial: 1.25,
  ppf: 1.8,
  chrome: 1.4,
  full_wrap: 1.0,
  partial_wrap: 0.6,
};

function detectVehicleClass(make: string, model: string): string {
  const lowerModel = model.toLowerCase();
  const lowerMake = make.toLowerCase();

  // Van detection
  if (lowerModel.includes("sprinter") || lowerModel.includes("transit") || 
      lowerModel.includes("promaster") || lowerModel.includes("van") ||
      lowerModel.includes("express") || lowerModel.includes("savana")) {
    return "van";
  }

  // Truck detection
  if (lowerModel.includes("f-150") || lowerModel.includes("f-250") || 
      lowerModel.includes("silverado") || lowerModel.includes("sierra") ||
      lowerModel.includes("ram") || lowerModel.includes("tundra") ||
      lowerModel.includes("tacoma") || lowerModel.includes("titan") ||
      lowerModel.includes("frontier") || lowerModel.includes("ranger") ||
      lowerModel.includes("colorado") || lowerModel.includes("ridgeline") ||
      lowerModel.includes("truck") || lowerModel.includes("pickup")) {
    return "truck";
  }

  // SUV detection
  if (lowerModel.includes("tahoe") || lowerModel.includes("suburban") ||
      lowerModel.includes("expedition") || lowerModel.includes("navigator") ||
      lowerModel.includes("escalade") || lowerModel.includes("yukon") ||
      lowerModel.includes("sequoia") || lowerModel.includes("4runner") ||
      lowerModel.includes("pathfinder") || lowerModel.includes("armada") ||
      lowerModel.includes("pilot") || lowerModel.includes("highlander") ||
      lowerModel.includes("explorer") || lowerModel.includes("durango") ||
      lowerModel.includes("wrangler") || lowerModel.includes("grand cherokee") ||
      lowerModel.includes("bronco") || lowerModel.includes("defender") ||
      lowerModel.includes("range rover") || lowerModel.includes("land cruiser")) {
    return "suv";
  }

  // Crossover detection
  if (lowerModel.includes("rav4") || lowerModel.includes("cr-v") ||
      lowerModel.includes("rogue") || lowerModel.includes("cx-5") ||
      lowerModel.includes("equinox") || lowerModel.includes("tucson") ||
      lowerModel.includes("santa fe") || lowerModel.includes("escape") ||
      lowerModel.includes("edge") || lowerModel.includes("enclave") ||
      lowerModel.includes("traverse") || lowerModel.includes("murano") ||
      lowerModel.includes("mdx") || lowerModel.includes("rdx") ||
      lowerModel.includes("nx") || lowerModel.includes("rx") ||
      lowerModel.includes("q5") || lowerModel.includes("q7") ||
      lowerModel.includes("x3") || lowerModel.includes("x5") ||
      lowerModel.includes("macan") || lowerModel.includes("cayenne") ||
      lowerModel.includes("model y") || lowerModel.includes("model x")) {
    return "crossover";
  }

  // Coupe detection
  if (lowerModel.includes("mustang") || lowerModel.includes("camaro") ||
      lowerModel.includes("challenger") || lowerModel.includes("corvette") ||
      lowerModel.includes("supra") || lowerModel.includes("370z") ||
      lowerModel.includes("brz") || lowerModel.includes("86") ||
      lowerModel.includes("miata") || lowerModel.includes("mx-5") ||
      lowerModel.includes("coupe") || lowerModel.includes("gt-r") ||
      lowerModel.includes("cayman") || lowerModel.includes("911") ||
      lowerModel.includes("m4") || lowerModel.includes("c63") ||
      lowerModel.includes("rc") || lowerModel.includes("lc")) {
    return "coupe";
  }

  // Hatchback detection
  if (lowerModel.includes("civic hatch") || lowerModel.includes("golf") ||
      lowerModel.includes("focus") || lowerModel.includes("fit") ||
      lowerModel.includes("veloster") || lowerModel.includes("corolla hatch") ||
      lowerModel.includes("mazda3") || lowerModel.includes("impreza hatch") ||
      lowerModel.includes("elantra gt") || lowerModel.includes("prius")) {
    return "hatchback";
  }

  // Wagon detection
  if (lowerModel.includes("wagon") || lowerModel.includes("outback") ||
      lowerModel.includes("v60") || lowerModel.includes("v90") ||
      lowerModel.includes("alltrack") || lowerModel.includes("avant")) {
    return "wagon";
  }

  // Default to sedan
  return "sedan";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      organization_id, 
      vehicle, 
      wrap_type = "color_change",
      sqft_override,
      material_cost_per_sqft = 8.50,
      labor_rate = 75,
      markup = 1.35
    } = await req.json();

    console.log("AI Quote Generation Request:", { organization_id, vehicle, wrap_type });

    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      return new Response(
        JSON.stringify({ error: "Vehicle information (year, make, model) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect vehicle class
    const vehicleClass = detectVehicleClass(vehicle.make, vehicle.model);
    console.log("Detected vehicle class:", vehicleClass);

    // Get SQFT - use override if provided, otherwise use default for class
    const sqft = sqft_override || DEFAULT_SQFT[vehicleClass] || DEFAULT_SQFT.default;
    
    // Get labor hours for this vehicle class
    const laborHours = LABOR_HOURS[vehicleClass] || LABOR_HOURS.default;
    
    // Get wrap type multiplier
    const wrapMultiplier = WRAP_TYPE_MULTIPLIERS[wrap_type] || 1.0;

    // Calculate costs
    const baseMaterialCost = sqft * material_cost_per_sqft;
    const adjustedMaterialCost = baseMaterialCost * wrapMultiplier;
    const laborCost = laborHours * labor_rate;
    const subtotal = adjustedMaterialCost + laborCost;
    const total = Math.round(subtotal * markup);

    // Calculate price range (±10%)
    const lowPrice = Math.round(total * 0.9);
    const highPrice = Math.round(total * 1.1);

    // Generate AI message using Lovable AI
    const wrapTypeDisplay = wrap_type.replace(/_/g, " ");
    const vehicleDisplay = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    let aiMessage = "";
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: `You are a friendly wrap shop assistant. Generate a brief, conversational price estimate message.
Keep it to 1-2 sentences max. Be helpful and suggest next steps.
Don't use asterisks or special formatting.`
            },
            { 
              role: "user", 
              content: `Generate a price estimate message for:
Vehicle: ${vehicleDisplay}
Wrap Type: ${wrapTypeDisplay}
Estimated Price Range: $${lowPrice.toLocaleString()} - $${highPrice.toLocaleString()}
Square Footage: ${sqft} sq ft`
            },
          ],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiMessage = aiData.choices?.[0]?.message?.content || "";
      }
    } catch (aiError) {
      console.error("AI message generation failed:", aiError);
    }

    // Fallback message if AI fails
    if (!aiMessage) {
      aiMessage = `For a ${vehicleDisplay} ${wrapTypeDisplay}, pricing typically ranges around $${lowPrice.toLocaleString()} - $${highPrice.toLocaleString()}. Want a visual preview of your wrap?`;
    }

    const result = {
      sqft,
      vehicle_class: vehicleClass,
      wrap_type,
      material_cost: Math.round(adjustedMaterialCost),
      labor_cost: Math.round(laborCost),
      labor_hours: laborHours,
      subtotal: Math.round(subtotal),
      total,
      low_price: lowPrice,
      high_price: highPrice,
      markup_applied: markup,
      ai_message: aiMessage,
      generated_at: new Date().toISOString(),
    };

    console.log("Quote generated successfully:", result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Quote Generation Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate quote";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
