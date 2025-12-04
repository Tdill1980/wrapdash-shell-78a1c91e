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

IMPORTANT: Return a FLAT JSON object with these exact keys (NOT nested categories):
{
  "customerName": "string or empty",
  "companyName": "string or empty", 
  "email": "string or empty",
  "phone": "string or empty",
  "vehicleYear": "string or empty",
  "vehicleMake": "string or empty",
  "vehicleModel": "string or empty",
  "serviceType": "string or empty",
  "productType": "string or empty",
  "finish": "string or empty",
  "notes": "string or empty"
}

Field definitions:
- customerName: Full name (e.g., "John Smith")
- companyName: Business name (e.g., "ABC Wraps")
- email: Email - convert "at" to @ and "dot" to . (e.g., "john at gmail dot com" = "john@gmail.com")
- phone: Phone number in any format
- vehicleYear: 4-digit year (2024, 2019, etc.)
- vehicleMake: Manufacturer (Ford, Chevy, Toyota, Honda, BMW, etc.)
- vehicleModel: Model name (F-150, Camry, Silverado, Model Y, etc.)
- serviceType: Service type (full wrap, partial wrap, color change, PPF, tint, chrome delete, etc.)
- productType: Brand/product (Avery, 3M, XPEL, Suntek, KPMF, Hexis, etc.)
- finish: Finish type (gloss, matte, satin, metallic, etc.)
- notes: Other details, deadlines, special requests

Example input: "Quote for John Smith at ABC Wraps, john@abc.com, 555-1234, 2024 Chevy Silverado, full wrap, 3M gloss black"
Example output: {"customerName":"John Smith","companyName":"ABC Wraps","email":"john@abc.com","phone":"555-1234","vehicleYear":"2024","vehicleMake":"Chevrolet","vehicleModel":"Silverado","serviceType":"full wrap","productType":"3M","finish":"gloss","notes":"black"}

Return ONLY the JSON object, no markdown, no explanation.`;

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
      console.log('📦 Raw parsed JSON:', JSON.stringify(parsed, null, 2));
      
      // Handle BOTH nested (old AI format) AND flat (new format) structures
      const customerInfo = parsed["CUSTOMER INFO"] || parsed["Customer Info"] || parsed;
      const vehicleInfo = parsed["VEHICLE INFO"] || parsed["Vehicle Info"] || parsed;
      const serviceInfo = parsed["SERVICE INFO"] || parsed["Service Info"] || parsed;
      const additional = parsed["ADDITIONAL"] || parsed["Additional"] || parsed;
      
      parsedData = {
        customerName: customerInfo.customerName || parsed.customerName || '',
        companyName: customerInfo.companyName || parsed.companyName || '',
        email: customerInfo.email || parsed.email || '',
        phone: customerInfo.phone || parsed.phone || '',
        vehicleYear: (vehicleInfo.vehicleYear || parsed.vehicleYear || '').toString(),
        vehicleMake: vehicleInfo.vehicleMake || parsed.vehicleMake || '',
        vehicleModel: vehicleInfo.vehicleModel || parsed.vehicleModel || '',
        serviceType: serviceInfo.serviceType || parsed.serviceType || '',
        productType: serviceInfo.productType || parsed.productType || '',
        finish: serviceInfo.finish || parsed.finish || '',
        notes: additional.notes || parsed.notes || ''
      };
      
      console.log('✨ Final parsed data:', JSON.stringify(parsedData, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse AI JSON response:', parseError);
      console.error('❌ Raw content was:', content);
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
