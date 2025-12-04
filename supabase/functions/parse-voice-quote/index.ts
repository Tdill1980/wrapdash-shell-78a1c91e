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
    const { transcript } = await req.json();
    
    if (!transcript || transcript.trim().length < 3) {
      console.log('❌ Transcript too short or empty:', transcript);
      return new Response(
        JSON.stringify({ 
          error: 'Transcript too short',
          parsedData: {} 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📝 Parsing transcript:', transcript);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a voice transcript parser for a vehicle wrap quote system. Extract ALL structured data from natural speech.

Extract the following fields if mentioned (leave empty string if not found):

CUSTOMER INFO:
- customerName: The customer's full name (e.g., "John Smith", "Sarah Johnson")
- companyName: Business/company name if mentioned (e.g., "ABC Wraps", "Vinyl Vixen")
- email: Email address - people might say "at" for @ and "dot" for . (e.g., "john at gmail dot com" = "john@gmail.com")
- phone: Phone number in any format (e.g., "555-123-4567", "five five five one two three four five six seven")

VEHICLE INFO:
- vehicleYear: The vehicle year (4 digits like 2024, 2019, etc.)
- vehicleMake: The vehicle manufacturer (Ford, Chevy/Chevrolet, Toyota, Honda, BMW, Mercedes, Audi, Lexus, etc.)
- vehicleModel: The specific model (F-150, Camry, Civic, 3 Series, Mustang, Corvette, Silverado, Model Y, etc.)

SERVICE INFO:
- serviceType: The type of service (wrap, color change, PPF, paint protection, tint, window tint, chrome delete, partial wrap, full wrap, printed wrap, etc.)
- productType: Specific brand/product if mentioned (Avery, 3M, XPEL, Suntek, KPMF, Hexis, etc.)
- finish: Finish type if mentioned (gloss, matte, satin, metallic, chrome, brushed)

ADDITIONAL:
- notes: Any other important details, special requests, deadlines, or requirements (e.g., "needs it by Friday", "chrome delete on mirrors", "wants racing stripes")

Be flexible with speech patterns. People might say:
- "Quote for John Smith at ABC Wraps, email john@abc.com, phone 555-1234, 2024 Ford F-150, full wrap"
- "Customer Sarah Johnson, Vinyl Vixen company, 2023 Tesla Model Y, gloss black color change, 3M film"
- "John needs a wrap on his 2019 Toyota Camry, matte finish, customer mentioned he wants it done by next week"
- "PPF on 2024 Porsche 911, customer is Mike at mike dot smith at gmail dot com"

Return ONLY valid JSON with these exact keys, no explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this voice transcript: "${transcript}"` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again", parsedData: {} }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted", parsedData: {} }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    console.log('🤖 AI response:', content);

    // Parse the JSON from AI response
    let parsedData = {
      customerName: '',
      companyName: '',
      email: '',
      phone: '',
      vehicleYear: '',
      vehicleMake: '',
      vehicleModel: '',
      serviceType: '',
      productType: '',
      finish: '',
      notes: ''
    };

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      parsedData = {
        customerName: parsed.customerName || '',
        companyName: parsed.companyName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        vehicleYear: parsed.vehicleYear?.toString() || '',
        vehicleMake: parsed.vehicleMake || '',
        vehicleModel: parsed.vehicleModel || '',
        serviceType: parsed.serviceType || '',
        productType: parsed.productType || '',
        finish: parsed.finish || '',
        notes: parsed.notes || ''
      };
    } catch (parseError) {
      console.error('❌ Failed to parse AI JSON response:', parseError);
    }

    console.log('✅ Parsed data:', parsedData);

    return new Response(
      JSON.stringify({ parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Error in parse-voice-quote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, parsedData: {} }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
