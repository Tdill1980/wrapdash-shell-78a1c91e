import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { WPW_PRICING, calculateQuickQuote } from "../_shared/wpw-pricing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteRequest {
  vehicleYear: string | number;
  vehicleMake: string;
  vehicleModel: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  productType?: string;
  organizationId?: string;
  conversationId?: string;
  autoEmail?: boolean;
  source?: string;
  sourceMessage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: QuoteRequest = await req.json();
    const { 
      vehicleYear, 
      vehicleMake, 
      vehicleModel, 
      customerName, 
      customerEmail,
      customerPhone,
      productType = 'avery', // Default to Avery Printed Wrap
      organizationId,
      conversationId,
      autoEmail = false,
      source = 'api',
      sourceMessage
    } = body;

    console.log('AI Auto-Quote Request:', { vehicleYear, vehicleMake, vehicleModel, customerEmail, productType });

    // Validate required fields
    if (!vehicleYear || !vehicleMake || !vehicleModel) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing vehicle information',
          missing: { vehicleYear: !vehicleYear, vehicleMake: !vehicleMake, vehicleModel: !vehicleModel }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const year = typeof vehicleYear === 'string' ? parseInt(vehicleYear) : vehicleYear;

    // Query vehicle dimensions for SQFT
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicle_dimensions')
      .select('corrected_sqft, side_sqft, back_sqft, hood_sqft, roof_sqft, make, model')
      .ilike('make', vehicleMake)
      .ilike('model', `%${vehicleModel}%`)
      .gte('year_end', year)
      .lte('year_start', year)
      .limit(1)
      .single();

    let sqft = 0;
    let vehicleMatch = null;

    if (vehicleData) {
      sqft = vehicleData.corrected_sqft || 0;
      vehicleMatch = vehicleData;
      console.log('Vehicle match found:', vehicleData);
    } else {
      // Fallback: Try any year for same make/model
      const { data: fallbackVehicle } = await supabase
        .from('vehicle_dimensions')
        .select('corrected_sqft, side_sqft, back_sqft, hood_sqft, roof_sqft, make, model')
        .ilike('make', vehicleMake)
        .ilike('model', `%${vehicleModel}%`)
        .limit(1)
        .single();

      if (fallbackVehicle) {
        sqft = fallbackVehicle.corrected_sqft || 0;
        vehicleMatch = fallbackVehicle;
        console.log('Fallback vehicle match:', fallbackVehicle);
      } else {
        // Default SQFT for unknown vehicles
        sqft = 250; // Average vehicle size
        console.log('No vehicle match, using default SQFT:', sqft);
      }
    }

    // Use WPW official pricing from shared module
    const quoteCalc = calculateQuickQuote(sqft, productType);
    const pricePerSqft = quoteCalc.pricePerSqft;
    const productName = quoteCalc.productName;

    console.log('Using WPW pricing:', { productName, pricePerSqft, sqft });

    // WPW is a WHOLESALE PRINT SHOP - NO LABOR, NO MARGIN
    // Formula: SQFT × Price Per SQFT = Total (material cost only)
    const materialCost = quoteCalc.materialCost;
    const totalPrice = materialCost; // WPW wholesale = material only, no markup

    // Generate quote number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quoteNumber = `WPW-${timestamp}-${random}`;

    // Create quote in database - WPW wholesale pricing (no labor, no margin)
    // ALWAYS create as pending_approval - requires human approval before email
    const quoteData = {
      quote_number: quoteNumber,
      customer_name: customerName || 'Website Visitor',
      customer_email: customerEmail || '',
      customer_phone: customerPhone || '',
      vehicle_year: String(year),
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      product_name: productName,
      sqft: sqft,
      material_cost: materialCost,
      labor_cost: 0, // WPW does NOT install
      margin: 0, // WPW wholesale = no retail margin
      total_price: totalPrice,
      status: 'pending_approval', // CHANGED: Always require approval
      ai_generated: true,
      ai_sqft_estimate: sqft,
      ai_labor_hours: 0, // WPW does NOT install
      ai_generated_at: new Date().toISOString(),
      organization_id: organizationId || null,
      source: source,
      source_message: sourceMessage || null,
      source_conversation_id: conversationId || null
    };

    const { data: createdQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteData)
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create quote', details: quoteError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Quote created (pending approval):', createdQuote);

    // REMOVED: Auto-email functionality - emails are ONLY sent after approval
    // The quote will appear in AI Approvals for human review
    const emailSent = false; // Never auto-send

    // Create AI action for tracking - ALWAYS requires approval
    await supabase.from('ai_actions').insert({
      action_type: 'auto_quote_generated',
      resolved: false, // ALWAYS require approval
      action_payload: {
        quote_id: createdQuote.id,
        quote_number: quoteNumber,
        vehicle: `${year} ${vehicleMake} ${vehicleModel}`,
        sqft: sqft,
        price_per_sqft: pricePerSqft,
        product_name: productName,
        total_price: totalPrice,
        customer_name: customerName || 'Website Visitor',
        customer_email: customerEmail || '',
        conversation_id: conversationId,
        pricing_model: 'WPW_WHOLESALE',
        pending_email: !!customerEmail // Flag that email can be sent on approval
      },
      priority: 'high',
      organization_id: organizationId
    });

    // Build friendly price message
    const formattedPrice = totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

    // Return success response with quote details
    // NOTE: Email will be sent after human approval in AI Approvals card
    return new Response(
      JSON.stringify({
        success: true,
        quote: {
          id: createdQuote.id,
          quoteNumber: quoteNumber,
          vehicle: `${year} ${vehicleMake} ${vehicleModel}`,
          sqft: sqft,
          pricePerSqft: pricePerSqft,
          productName: productName,
          materialCost: materialCost,
          laborCost: 0, // WPW does not install
          totalPrice: totalPrice,
          formattedPrice: formattedPrice,
          status: 'pending_approval'
        },
        emailSent: false, // NEVER auto-send
        pendingApproval: true, // Flag that approval is required
        message: `Quote generated for ${year} ${vehicleMake} ${vehicleModel}: ${formattedPrice}. Awaiting approval before sending to customer.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('AI Auto-Quote Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
