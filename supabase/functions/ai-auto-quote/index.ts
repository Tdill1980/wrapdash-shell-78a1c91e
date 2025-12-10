import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      productType = 'Full Color Change Wrap',
      organizationId,
      conversationId,
      autoEmail = false
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

    // Query products table for pricing
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, product_name, price_per_sqft, flat_price, pricing_type, category')
      .ilike('product_name', `%${productType}%`)
      .eq('is_active', true)
      .limit(1)
      .single();

    let pricePerSqft = 8.50; // Default price per sqft
    let productName = productType;
    let productId = null;

    if (productData) {
      pricePerSqft = productData.price_per_sqft || pricePerSqft;
      productName = productData.product_name;
      productId = productData.id;
      console.log('Product match:', productData);
    }

    // Calculate quote using same logic as useQuoteEngine
    const materialCost = sqft * pricePerSqft;
    const installHours = Math.ceil(sqft / 25);
    const installRatePerHour = 75;
    const laborCost = installHours * installRatePerHour;
    const subtotal = materialCost + laborCost;
    const marginPercent = 65;
    const marginAmount = subtotal * (marginPercent / 100);
    const totalPrice = subtotal + marginAmount;

    // Generate quote number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quoteNumber = `AQ-${timestamp}-${random}`;

    // Create quote in database
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
      labor_cost: laborCost,
      margin: marginPercent,
      total_price: totalPrice,
      status: 'pending',
      ai_generated: true,
      ai_sqft_estimate: sqft,
      ai_labor_hours: installHours,
      ai_generated_at: new Date().toISOString(),
      organization_id: organizationId || null
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

    console.log('Quote created:', createdQuote);

    // If autoEmail is true and we have customer email, send quote email
    let emailSent = false;
    if (autoEmail && customerEmail) {
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-mightymail-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            quoteId: createdQuote.id,
            recipientEmail: customerEmail,
            recipientName: customerName || 'Valued Customer'
          })
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('Quote email sent to:', customerEmail);
        } else {
          console.error('Failed to send quote email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    // Create AI action for tracking
    await supabase.from('ai_actions').insert({
      action_type: 'auto_quote_generated',
      action_payload: {
        quote_id: createdQuote.id,
        quote_number: quoteNumber,
        vehicle: `${year} ${vehicleMake} ${vehicleModel}`,
        total_price: totalPrice,
        email_sent: emailSent,
        conversation_id: conversationId
      },
      priority: 'high',
      organization_id: organizationId
    });

    // Return success response with quote details
    return new Response(
      JSON.stringify({
        success: true,
        quote: {
          id: createdQuote.id,
          quoteNumber: quoteNumber,
          vehicle: `${year} ${vehicleMake} ${vehicleModel}`,
          sqft: sqft,
          materialCost: materialCost,
          laborCost: laborCost,
          totalPrice: totalPrice,
          formattedPrice: `$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        },
        emailSent: emailSent,
        message: `Great news! I've prepared your quote for the ${year} ${vehicleMake} ${vehicleModel} full wrap - ${totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}. ${emailSent ? 'Check your email for the full details!' : ''}`
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
