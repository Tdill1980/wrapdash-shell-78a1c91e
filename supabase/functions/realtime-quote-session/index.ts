import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log("Creating OpenAI Realtime session...");

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `You are a professional wrap shop quote assistant helping customers build quotes for vehicle wrap services.

Your role is to:
1. Greet the customer warmly and ask what service they need
2. Collect vehicle details (year, make, model) - be specific about the year
3. Ask about the service type:
   - Full Wrap (covers entire vehicle)
   - Partial Wrap (specific panels: sides, back, hood, roof)
   - Color Change (wrapping vehicle in a new color)
   - Paint Protection Film (PPF)
   - Window Tinting
4. Collect customer information (name, company, phone, email)
5. Ask about any add-ons (chrome delete, roof rack removal, design work)

When you have enough information, use the provided tools to:
- set_vehicle() to populate vehicle details
- set_customer() to fill in customer information
- set_service() to select the service type and panels
- calculate_quote() to trigger the quote calculation

Speak naturally and professionally. Keep responses concise. Confirm details back to the customer before finalizing. If they mention a vehicle, immediately ask for the year, make, and model to get accurate pricing.

Example flow:
"Hi! I'm here to help you build a quote for your vehicle wrap. What kind of service are you interested in today?"
→ Customer: "I need a full wrap for my truck"
→ "Great! To give you an accurate quote, what's the year, make, and model of your truck?"
→ Customer: "2023 Ford F-150"
→ "Perfect! A 2023 Ford F-150. Now, are you looking for a custom design wrap, a color change, or something else?"

Keep the conversation flowing naturally and use the tools when you have the information needed.`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created successfully:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
