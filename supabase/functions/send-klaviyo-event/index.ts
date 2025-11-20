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
    const { eventName, properties, customerEmail } = await req.json();
    
    const KLAVIYO_API_KEY = Deno.env.get('KLAVIYO_API_KEY');
    if (!KLAVIYO_API_KEY) {
      throw new Error('KLAVIYO_API_KEY not configured');
    }

    const payload = {
      data: {
        type: "event",
        attributes: {
          metric: { name: eventName },
          properties: properties,
          customer_properties: {
            "$email": customerEmail
          }
        }
      }
    };

    console.log('Sending Klaviyo event:', eventName, 'for:', customerEmail);

    const response = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'revision': '2024-10-15',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo API error:', response.status, errorText);
      throw new Error(`Klaviyo API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Klaviyo event sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-klaviyo-event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
