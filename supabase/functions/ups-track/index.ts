import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_number } = await req.json();

    if (!tracking_number) {
      return new Response(
        JSON.stringify({ error: 'Tracking number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Tracking UPS package:', tracking_number);

    // TODO: Integrate with UPS API
    // For now, return mock data structure
    // Replace this with actual UPS API integration using UPS_API_KEY secret
    
    const mockData = {
      status: 'In Transit',
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Phoenix, AZ',
      events: [
        {
          time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          status: 'Departed from facility',
          location: 'Phoenix, AZ'
        },
        {
          time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'Arrived at facility',
          location: 'Phoenix, AZ'
        },
        {
          time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'In transit',
          location: 'Los Angeles, CA'
        },
        {
          time: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          status: 'Origin scan',
          location: 'San Diego, CA'
        },
        {
          time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          status: 'Label created',
          location: 'San Diego, CA'
        }
      ]
    };

    return new Response(
      JSON.stringify(mockData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in ups-track function:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Failed to fetch tracking data',
        status: 'Unknown',
        events: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
