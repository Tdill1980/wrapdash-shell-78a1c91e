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

    const systemPrompt = `You are a voice transcript parser for a vehicle wrap quote system. Extract structured data from natural speech.

Extract the following fields if mentioned (leave empty string if not found):
- customerName: The customer's name (could be mentioned as "for John", "customer John Smith", "John's", etc.)
- vehicleYear: The vehicle year (4 digits like 2024, 2019, etc.)
- vehicleMake: The vehicle manufacturer (Ford, Chevy/Chevrolet, Toyota, Honda, BMW, Mercedes, Audi, Lexus, Acura, Infiniti, Nissan, Mazda, Subaru, Volkswagen, Porsche, Jeep, Dodge, Ram, GMC, Cadillac, Lincoln, Buick, Chrysler, Kia, Hyundai, Genesis, Volvo, Land Rover, Jaguar, Mini, Fiat, Alfa Romeo, Maserati, Ferrari, Lamborghini, Tesla, Rivian, Lucid, etc.)
- vehicleModel: The specific model (F-150, Camry, Civic, 3 Series, Mustang, Corvette, Silverado, etc.)
- serviceType: The type of service (wrap, color change, PPF, paint protection, tint, window tint, chrome delete, partial wrap, full wrap, etc.)
- productType: Specific product if mentioned (Avery, 3M, XPEL, Suntek, etc.)

Be flexible with speech patterns. People might say:
- "Quote for John Smith, 2024 Ford F-150, full wrap"
- "John needs a wrap on his 2019 Toyota Camry"
- "Color change for a 2023 BMW M3"
- "PPF on 2024 Porsche 911"

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
      vehicleYear: '',
      vehicleMake: '',
      vehicleModel: '',
      serviceType: '',
      productType: ''
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
        vehicleYear: parsed.vehicleYear?.toString() || '',
        vehicleMake: parsed.vehicleMake || '',
        vehicleModel: parsed.vehicleModel || '',
        serviceType: parsed.serviceType || '',
        productType: parsed.productType || ''
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
