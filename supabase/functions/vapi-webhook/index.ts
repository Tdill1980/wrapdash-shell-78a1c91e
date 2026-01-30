import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WPW_ORG_ID = "51aa96db-c06d-41ae-b3cb-25b045c75caf";

interface VapiToolCall {
  type: string;
  function?: {
    name: string;
    arguments: Record<string, any>;
  };
}

interface VapiMessage {
  type: string;
  call?: {
    id: string;
    customer?: {
      number?: string;
    };
  };
  toolCalls?: VapiToolCall[];
  message?: {
    role: string;
    content: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: VapiMessage = await req.json();
    console.log("[vapi-webhook] Received:", JSON.stringify(body, null, 2));

    // Handle different Vapi event types
    switch (body.type) {
      case "function-call":
      case "tool-calls": {
        // Handle tool calls from Vapi
        const toolCalls = body.toolCalls || [];
        const results = [];

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function?.name;
          const args = toolCall.function?.arguments || {};

          console.log(`[vapi-webhook] Tool call: ${functionName}`, args);

          if (functionName === "submit_quote_request") {
            // Call the ai-auto-quote function
            const { vehicleYear, vehicleMake, vehicleModel, customerName, customerPhone, customerEmail, productType } = args;

            const { data, error } = await supabase.functions.invoke("ai-auto-quote", {
              body: {
                vehicleYear,
                vehicleMake,
                vehicleModel,
                customerName,
                customerPhone,
                customerEmail,
                productType: productType || "avery",
                organizationId: WPW_ORG_ID,
                source: "vapi_phone",
                sourceMessage: `Phone quote request for ${vehicleYear} ${vehicleMake} ${vehicleModel}`,
              },
            });

            if (error) {
              console.error("[vapi-webhook] ai-auto-quote error:", error);
              results.push({
                name: functionName,
                result: JSON.stringify({ success: false, error: error.message }),
              });
            } else {
              console.log("[vapi-webhook] ai-auto-quote result:", data);
              results.push({
                name: functionName,
                result: JSON.stringify(data),
              });
            }
          } else if (functionName === "lookup_vehicle_quote") {
            // Look up vehicle dimensions and calculate quote
            const { vehicleYear, vehicleMake, vehicleModel, productType } = args;
            const year = typeof vehicleYear === "string" ? parseInt(vehicleYear) : vehicleYear;

            // Query vehicle dimensions
            const { data: vehicleData, error: vehicleError } = await supabase
              .from("vehicle_dimensions")
              .select("corrected_sqft, make, model")
              .ilike("make", vehicleMake)
              .ilike("model", `%${vehicleModel}%`)
              .gte("year_end", year)
              .lte("year_start", year)
              .limit(1)
              .single();

            if (vehicleError || !vehicleData) {
              // Try fallback without year
              const { data: fallbackData } = await supabase
                .from("vehicle_dimensions")
                .select("corrected_sqft, make, model")
                .ilike("make", vehicleMake)
                .ilike("model", `%${vehicleModel}%`)
                .limit(1)
                .single();

              if (fallbackData) {
                const sqft = fallbackData.corrected_sqft || 0;
                const pricePerSqft = productType === "color_change" ? 9.5 : 12.5;
                const totalPrice = Math.round(sqft * pricePerSqft);

                results.push({
                  name: functionName,
                  result: JSON.stringify({
                    success: true,
                    vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
                    sqft,
                    pricePerSqft,
                    totalPrice,
                    formattedPrice: `$${totalPrice.toLocaleString()}`,
                  }),
                });
              } else {
                results.push({
                  name: functionName,
                  result: JSON.stringify({
                    success: false,
                    error: "Vehicle not found in database",
                    message: "I couldn't find that vehicle in our database. Can you provide more details about the year, make, and model?",
                  }),
                });
              }
            } else {
              const sqft = vehicleData.corrected_sqft || 0;
              const pricePerSqft = productType === "color_change" ? 9.5 : 12.5;
              const totalPrice = Math.round(sqft * pricePerSqft);

              results.push({
                name: functionName,
                result: JSON.stringify({
                  success: true,
                  vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
                  sqft,
                  pricePerSqft,
                  totalPrice,
                  formattedPrice: `$${totalPrice.toLocaleString()}`,
                }),
              });
            }
          } else {
            // Unknown function
            results.push({
              name: functionName,
              result: JSON.stringify({ error: `Unknown function: ${functionName}` }),
            });
          }
        }

        return new Response(JSON.stringify({ results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "assistant-request": {
        // Return assistant configuration if needed
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "status-update": {
        // Log call status updates
        const callId = body.call?.id;
        console.log(`[vapi-webhook] Call ${callId} status update`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "end-of-call-report": {
        // Handle end of call - could log to phone_calls table
        const callId = body.call?.id;
        const customerNumber = body.call?.customer?.number;
        console.log(`[vapi-webhook] Call ended: ${callId} from ${customerNumber}`);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        console.log(`[vapi-webhook] Unhandled event type: ${body.type}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("[vapi-webhook] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
