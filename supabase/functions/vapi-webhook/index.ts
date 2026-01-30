// ===========================================
// ⚠️ LOCKED - VAPI WEBHOOK - DO NOT MODIFY ⚠️
// Last Updated: January 30, 2026
// ===========================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Correct WPW Organization ID - LOCKED
const WPW_ORG_ID = "51aa96db-c06d-41ae-b3cb-25b045c75caf";

// WPW Pricing - LOCKED (FIXED: 3M wrap film is same price as Avery!)
const WPW_PRICING = {
  avery: 5.27,        // Avery MPI 1105 + DOL1460Z
  threeM: 5.27,       // 3M IJ180Cv3 + 8518 ← FIXED: Same as Avery!
  windowPerf: 5.32,   // Window Perf 50/50
  cutAvery: 6.32,     // Cut Contour Avery
  cutThreeM: 6.92,    // Cut Contour 3M
};

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
    transcript?: string;
    recordingUrl?: string;
  };
  toolCalls?: VapiToolCall[];
  message?: {
    role: string;
    content: string;
  };
  // End-of-call report fields
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
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

            console.log(`[vapi-webhook] Looking up: ${vehicleYear} ${vehicleMake} ${vehicleModel}`);

            // Query vehicle dimensions - FIXED year filter logic
            const { data: vehicleData, error: vehicleError } = await supabase
              .from("vehicle_dimensions")
              .select("corrected_sqft, total_sqft, make, model, year_start, year_end")
              .ilike("make", vehicleMake)
              .ilike("model", `%${vehicleModel}%`)
              .lte("year_start", year)  // FIXED: year_start <= year
              .gte("year_end", year)    // FIXED: year_end >= year
              .limit(1)
              .single();

            if (vehicleError || !vehicleData) {
              console.log(`[vapi-webhook] No exact match, trying fallback`);
              // Try fallback without year
              const { data: fallbackData } = await supabase
                .from("vehicle_dimensions")
                .select("corrected_sqft, total_sqft, make, model")
                .ilike("make", vehicleMake)
                .ilike("model", `%${vehicleModel}%`)
                .limit(1)
                .single();

              if (fallbackData) {
                // Use corrected_sqft (minus roof) or total_sqft as fallback
                const sqft = fallbackData.corrected_sqft || fallbackData.total_sqft || 250;
                // FIXED: Use WPW pricing - $5.27/sqft for Avery (default)
                const pricePerSqft = WPW_PRICING.avery;
                const totalPrice = Math.round(sqft * pricePerSqft);

                console.log(`[vapi-webhook] Fallback found: ${sqft} sqft, $${totalPrice}`);

                results.push({
                  name: functionName,
                  result: JSON.stringify({
                    success: true,
                    vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
                    sqft,
                    pricePerSqft,
                    totalPrice,
                    formattedPrice: `$${totalPrice.toLocaleString()}`,
                    material: "Avery MPI 1105 with lamination",
                    note: "Price is for print-ready material only. Installation is done by your local shop.",
                  }),
                });
              } else {
                // No match at all - use estimate
                console.log(`[vapi-webhook] No match found, using estimate`);
                results.push({
                  name: functionName,
                  result: JSON.stringify({
                    success: false,
                    error: "Vehicle not found in database",
                    message: "I couldn't find that exact vehicle in our database. Can you tell me more about the vehicle? Or I can give you an estimate - most full-size trucks are around 280-320 sqft, which would be $1,475 to $1,686 for printed wrap material.",
                    estimateRange: "$1,200 - $2,000 for most vehicles",
                  }),
                });
              }
            } else {
              // Exact match found
              const sqft = vehicleData.corrected_sqft || vehicleData.total_sqft || 250;
              // FIXED: Use WPW pricing - $5.27/sqft for Avery (default)
              const pricePerSqft = WPW_PRICING.avery;
              const totalPrice = Math.round(sqft * pricePerSqft);

              console.log(`[vapi-webhook] Exact match: ${sqft} sqft, $${totalPrice}`);

              results.push({
                name: functionName,
                result: JSON.stringify({
                  success: true,
                  vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
                  sqft,
                  pricePerSqft,
                  totalPrice,
                  formattedPrice: `$${totalPrice.toLocaleString()}`,
                  material: "Avery MPI 1105 with lamination",
                  freeShipping: totalPrice >= 750,
                  note: totalPrice >= 750 
                    ? "Free shipping included! Price is for print-ready material. Installation is done by your local shop."
                    : "Price is for print-ready material only. Installation is done by your local shop.",
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
        // Handle end of call - insert into phone_calls table
        const callId = body.call?.id;
        const customerNumber = body.call?.customer?.number;
        const transcript = body.transcript || body.call?.transcript || '';
        const summary = body.summary || '';
        const recordingUrl = body.recordingUrl || body.call?.recordingUrl || null;
        
        console.log(`[vapi-webhook] Call ended: ${callId} from ${customerNumber}`);
        console.log(`[vapi-webhook] Transcript length: ${transcript.length}, Summary: ${summary.substring(0, 100)}`);

        // Insert into phone_calls table
        try {
          const { data: phoneCall, error: insertError } = await supabase
            .from('phone_calls')
            .insert({
              vapi_call_id: callId,
              caller_phone: customerNumber,
              organization_id: WPW_ORG_ID,
              transcript: transcript,
              summary: summary,
              recording_url: recordingUrl,
              status: 'completed',
              source: 'vapi',
              call_type: 'inbound',
              metadata: {
                raw_report: body,
                processed_at: new Date().toISOString()
              }
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('[vapi-webhook] Failed to insert phone_calls:', insertError);
          } else {
            console.log('[vapi-webhook] Phone call record created:', phoneCall?.id);
          }

          // Create escalation/alert if hot lead detected
          const isHotLead = 
            summary.toLowerCase().includes('quote') || 
            summary.toLowerCase().includes('fleet') ||
            summary.toLowerCase().includes('wrap') ||
            summary.toLowerCase().includes('price') ||
            transcript.toLowerCase().includes('ready to order');

          if (isHotLead) {
            console.log('[vapi-webhook] Hot lead detected, creating SMS alert');
            
            // Alert Jackson
            await supabase.from('ai_actions').insert({
              action_type: 'send_sms_alert',
              status: 'pending',
              organization_id: WPW_ORG_ID,
              action_payload: {
                phone: '+14807726003', // Jackson
                message: `📞 Phone lead from ${customerNumber || 'Unknown'}\n${summary.substring(0, 150) || 'Quote inquiry'}`
              }
            });

            // Also alert Trish
            await supabase.from('ai_actions').insert({
              action_type: 'send_sms_alert',
              status: 'pending',
              organization_id: WPW_ORG_ID,
              action_payload: {
                phone: '+16233135418', // Trish
                message: `📞 Phone lead from ${customerNumber || 'Unknown'}\n${summary.substring(0, 150) || 'Quote inquiry'}`
              }
            });
          }
        } catch (e) {
          console.error('[vapi-webhook] Error processing end-of-call:', e);
        }
        
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
