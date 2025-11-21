import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

// Map UPS status to ShopFlow stage
const mapUPSStatusToStage = (upsStatus: string): string => {
  const statusLower = upsStatus.toLowerCase();
  
  if (statusLower.includes('label created') || statusLower.includes('order processed')) {
    return 'print-production';
  }
  if (statusLower.includes('in transit') || statusLower.includes('on the way')) {
    return 'shipped';
  }
  if (statusLower.includes('out for delivery')) {
    return 'shipped';
  }
  if (statusLower.includes('delivered')) {
    return 'completed';
  }
  if (statusLower.includes('exception') || statusLower.includes('delayed')) {
    return 'on-hold';
  }
  
  return 'processing'; // Default fallback
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_number, order_id } = await req.json();

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

    // Update ShopFlow order status if order_id provided
    if (order_id) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const newStage = mapUPSStatusToStage(currentStatus);
        
        // Get current order to check if status changed
        const { data: currentOrder } = await supabase
          .from('shopflow_orders')
          .select('status')
          .eq('id', order_id)
          .single();

        if (currentOrder && currentOrder.status !== newStage) {
          // Update order status
          await supabase
            .from('shopflow_orders')
            .update({ 
              status: newStage,
              updated_at: new Date().toISOString()
            })
            .eq('id', order_id);

          // Add timeline event
          await supabase
            .from('shopflow_logs')
            .insert({
              order_id: order_id,
              event_type: 'status_change',
              payload: {
                old_status: currentOrder.status,
                new_status: newStage,
                tracking_status: currentStatus,
                automated: true,
                source: 'ups_tracking'
              }
            });

          console.log(`Updated order ${order_id} status: ${currentOrder.status} → ${newStage}`);
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        // Don't fail the whole request if status update fails
      }
    }

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
