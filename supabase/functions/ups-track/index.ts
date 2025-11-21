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

    console.log('Fetching UPS tracking data for:', tracking_number);

    // Fetch UPS public tracking page
    const upsUrl = `https://www.ups.com/track?loc=en_US&tracknum=${tracking_number}`;
    const htmlResponse = await fetch(upsUrl);
    const html = await htmlResponse.text();

    // Extract JSON data from __UPS_DATA__ script tag
    const jsonMatch = html.match(/<script id="__UPS_DATA__" type="application\/json">(.+?)<\/script>/s);
    
    if (!jsonMatch || !jsonMatch[1]) {
      console.error('Could not extract UPS data from HTML');
      return new Response(
        JSON.stringify({ 
          error: 'Could not parse tracking data',
          status: 'Unknown',
          events: []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const upsData = JSON.parse(jsonMatch[1]);
    console.log('Successfully parsed UPS data');

    // Navigate to the tracking response
    const trackResponse = upsData?.trackDetails?.trackDetails?.[0];
    
    if (!trackResponse) {
      console.error('No tracking response found');
      return new Response(
        JSON.stringify({ 
          status: 'Unknown',
          events: []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract package data
    const pkg = trackResponse.shipmentProgressActivities || [];
    const currentStatus = trackResponse.packageStatus || 'Unknown';
    const deliveryDate = trackResponse.scheduledDeliveryDate;
    const deliveryLocation = trackResponse.deliveryLocation?.city;

    // Map UPS activities to ShopFlow event format
    const events = pkg.slice(0, 5).map((activity: any) => ({
      time: activity.date ? `${activity.date}T${activity.time || '00:00:00'}` : new Date().toISOString(),
      status: activity.activityScan || 'Update',
      location: activity.location ? `${activity.location.city || ''}, ${activity.location.stateProvince || ''}`.trim() : ''
    }));

    // Normalize to ShopFlow schema
    const normalizedData = {
      status: currentStatus,
      eta: deliveryDate || undefined,
      location: deliveryLocation || events[0]?.location || undefined,
      events: events
    };

    console.log('Returning normalized tracking data:', normalizedData);

    return new Response(
      JSON.stringify(normalizedData),
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
