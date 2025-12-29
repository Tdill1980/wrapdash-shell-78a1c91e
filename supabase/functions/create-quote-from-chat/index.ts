// Create Quote from Chat - Generates and sends quote from website chat
// Called when Jordan has collected email + vehicle info
// Creates quote record, sends email, creates follow-up task

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { WPW_PRICING, calculateQuickQuote } from "../_shared/wpw-pricing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vehicle SQFT lookup (simplified - matches website-chat estimates)
const VEHICLE_SQFT: Record<string, number> = {
  // Compact cars
  'prius': 175, 'civic': 175, 'corolla': 175, 'sentra': 175, 'versa': 175,
  'yaris': 175, 'fit': 175, 'accent': 175, 'rio': 175, 'mirage': 175,
  // Midsize sedans
  'camry': 200, 'accord': 200, 'altima': 200, 'sonata': 200, 'mazda6': 200,
  'legacy': 200, 'jetta': 200, 'passat': 200, 'optima': 200, 'k5': 200,
  // Full-size sedans
  'avalon': 210, 'maxima': 210, '300': 210, 'charger': 210, 'impala': 210, 'taurus': 210,
  // Compact SUVs
  'rav4': 200, 'crv': 200, 'cr-v': 200, 'tucson': 200, 'rogue': 200,
  'forester': 200, 'crosstrek': 200, 'cx5': 200, 'cx-5': 200, 'tiguan': 200,
  'sportage': 200, 'seltos': 200, 'kona': 200, 'venue': 200,
  // Midsize SUVs
  'highlander': 225, 'pilot': 225, 'explorer': 225, 'pathfinder': 225,
  '4runner': 225, 'cx9': 225, 'cx-9': 225, 'atlas': 225, 'palisade': 225,
  'telluride': 225, 'sorento': 225,
  // Full-size trucks
  'f150': 250, 'f-150': 250, 'silverado': 250, 'sierra': 250, 'ram': 250,
  'tundra': 250, 'titan': 250, 'f250': 275, 'f-250': 275, 'f350': 275, 'f-350': 275,
  // Large SUVs
  'tahoe': 275, 'expedition': 275, 'suburban': 300, 'yukon': 275,
  'sequoia': 275, 'armada': 275, 'escalade': 275, 'navigator': 275,
  // Cargo vans
  'transit': 350, 'sprinter': 350, 'promaster': 350, 'express': 300, 'savana': 300,
  // Sports cars
  'mustang': 180, 'camaro': 180, 'challenger': 190, 'corvette': 175,
  'supra': 170, '370z': 170, '86': 160, 'brz': 160, 'miata': 150, 'mx5': 150,
  // Compact trucks
  'tacoma': 200, 'colorado': 200, 'ranger': 200, 'maverick': 180, 'frontier': 200,
  // Jeeps
  'wrangler': 200, 'gladiator': 220, 'cherokee': 200, 'grand cherokee': 220,
  // SUVs
  'bronco': 200, 'defender': 225, 'range rover': 250,
};

function getVehicleSqft(make: string, model: string): number {
  const modelLower = model.toLowerCase().replace(/\s+/g, '');
  const modelWithSpaces = model.toLowerCase();
  
  // Check exact match first
  if (VEHICLE_SQFT[modelLower]) return VEHICLE_SQFT[modelLower];
  if (VEHICLE_SQFT[modelWithSpaces]) return VEHICLE_SQFT[modelWithSpaces];
  
  // Check partial matches
  for (const [key, sqft] of Object.entries(VEHICLE_SQFT)) {
    if (modelLower.includes(key) || key.includes(modelLower)) {
      return sqft;
    }
  }
  
  // Default based on common patterns
  if (/van|sprinter|transit|promaster/i.test(model)) return 350;
  if (/truck|f-?\d{3}|silverado|sierra|ram|tundra/i.test(model)) return 250;
  if (/suv|tahoe|expedition|suburban|yukon/i.test(model)) return 275;
  
  // ❌ NO SILENT FALLBACK
  console.warn('[PRICING BLOCKED]', {
    source: 'create-quote-from-chat',
    vehicle: { make, model },
    reason: 'No pattern match for vehicle model'
  });
  return 0; // Zero = pricing blocked
}

function generateQuoteNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WPW-${dateStr}-${random}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      conversation_id,
      customer_email,
      customer_name,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      product_type = 'avery', // 'avery' or '3m'
      send_email = true,
      organization_id = '51aa96db-c06d-41ae-b3cb-25b045c75caf'
    } = await req.json();

    console.log('[CreateQuoteFromChat] Starting:', { conversation_id, customer_email, vehicle_make, vehicle_model });

    if (!customer_email) {
      return new Response(JSON.stringify({ error: 'Customer email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate SQFT and pricing
    const sqft = getVehicleSqft(vehicle_make || '', vehicle_model || '');
    
    // ❌ NO SILENT FALLBACK - Block pricing for unknown vehicles
    if (sqft === 0) {
      console.warn('[CreateQuoteFromChat] PRICING BLOCKED - vehicle not recognized', {
        vehicle_make, vehicle_model, vehicle_year
      });
      
      return new Response(JSON.stringify({ 
        success: true,
        needs_review: true,
        message: 'Vehicle information insufficient for pricing. Manual review required.',
        vehicle: { year: vehicle_year, make: vehicle_make, model: vehicle_model }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const pricePerSqft = 5.27; // Both Avery and 3M are now $5.27
    const materialCost = Math.round(sqft * pricePerSqft * 100) / 100;
    const quoteNumber = generateQuoteNumber();

    console.log('[CreateQuoteFromChat] Calculated:', { sqft, pricePerSqft, materialCost, quoteNumber });

    // Create quote record
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteNumber,
        organization_id,
        customer_name: customer_name || `Website Lead (${customer_email})`,
        customer_email,
        vehicle_year: vehicle_year ? parseInt(vehicle_year) : null,
        vehicle_make,
        vehicle_model,
        sqft,
        material_cost: materialCost,
        total_price: materialCost, // Material only for now
        status: 'sent',
        source: 'website_chat',
        ai_generated: true,
        metadata: {
          created_via: 'create_quote_from_chat',
          conversation_id,
          product_type,
          price_per_sqft: pricePerSqft,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (quoteError) {
      console.error('[CreateQuoteFromChat] Quote creation error:', quoteError);
      throw quoteError;
    }

    console.log('[CreateQuoteFromChat] Quote created:', quote.id);

    // Update conversation with quote info
    if (conversation_id) {
      await supabase
        .from('conversations')
        .update({
          chat_state: {
            quote_id: quote.id,
            quote_number: quoteNumber,
            quote_sent: true,
            quote_sent_at: new Date().toISOString()
          },
          status: 'quote_sent'
        })
        .eq('id', conversation_id);
    }

    // Create MightyTask for Alex Morgan (quote follow-up)
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: `Quote Follow-Up: ${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''} - $${materialCost}`.trim(),
        description: `Website chat quote sent to ${customer_email}. Vehicle: ${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''} (${sqft} sqft). Material: $${materialCost}. Follow up to close!`,
        status: 'pending',
        priority: materialCost > 1500 ? 'high' : 'medium',
        assigned_to: 'alex_morgan',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
        organization_id,
        metadata: {
          type: 'quote_followup',
          quote_id: quote.id,
          quote_number: quoteNumber,
          customer_email,
          conversation_id,
          source: 'website_chat',
          material_cost: materialCost
        }
      });

    if (taskError) {
      console.error('[CreateQuoteFromChat] Task creation error:', taskError);
    }

    // Send quote email
    let emailSent = false;
    if (send_email && resendKey) {
      const vehicleDisplay = `${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''}`.trim() || 'Your Vehicle';
      const productDisplay = product_type.toLowerCase().includes('3m') ? '3M IJ180Cv3' : 'Avery MPI 1105';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0066cc;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="color:white;margin:0;font-size:28px;">WePrintWraps</h1>
      <p style="color:#cce5ff;margin:10px 0 0;font-size:14px;">Wholesale Vehicle Wrap Printing</p>
    </div>
    
    <div style="background:white;padding:30px;border-radius:0 0 8px 8px;">
      <h2 style="color:#333;margin:0 0 20px;">Your Quote is Ready!</h2>
      
      <p style="color:#666;line-height:1.6;">
        Hey${customer_name ? ` ${customer_name.split(' ')[0]}` : ''}! 👋
      </p>
      
      <p style="color:#666;line-height:1.6;">
        Thanks for chatting with us! Here's your wrap quote for the <strong>${vehicleDisplay}</strong>:
      </p>
      
      <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;color:#666;">Vehicle:</td>
            <td style="padding:10px 0;text-align:right;font-weight:bold;color:#333;">${vehicleDisplay}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#666;">Square Footage:</td>
            <td style="padding:10px 0;text-align:right;font-weight:bold;color:#333;">${sqft} sqft</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#666;">Material:</td>
            <td style="padding:10px 0;text-align:right;font-weight:bold;color:#333;">${productDisplay}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#666;">Price per sqft:</td>
            <td style="padding:10px 0;text-align:right;font-weight:bold;color:#333;">$${pricePerSqft.toFixed(2)}</td>
          </tr>
          <tr style="border-top:2px solid #dee2e6;">
            <td style="padding:15px 0;color:#333;font-size:18px;font-weight:bold;">Material Total:</td>
            <td style="padding:15px 0;text-align:right;font-size:24px;font-weight:bold;color:#0066cc;">$${materialCost.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      
      <div style="background:#e8f4fd;border-left:4px solid #0066cc;padding:15px;margin:20px 0;">
        <p style="margin:0;color:#0066cc;font-weight:bold;">🔥 Both Avery AND 3M are now $5.27/sqft!</p>
        <p style="margin:5px 0 0;color:#666;font-size:14px;">3M just dropped their price to match Avery - you get premium quality at the same great price!</p>
      </div>
      
      <p style="color:#666;line-height:1.6;">
        <strong>What's included:</strong>
      </p>
      <ul style="color:#666;line-height:1.8;padding-left:20px;">
        <li>Printed wrap film with lamination</li>
        <li>Pre-paneled and ready to install</li>
        <li>FREE shipping on orders over $750</li>
        <li>1-2 business day production</li>
        <li>100% quality guarantee</li>
      </ul>
      
      <div style="text-align:center;margin:30px 0;">
        <a href="https://weprintwraps.com/our-products/" style="display:inline-block;background:#0066cc;color:white;padding:15px 40px;text-decoration:none;border-radius:5px;font-weight:bold;font-size:16px;">View Our Products</a>
      </div>
      
      <p style="color:#666;line-height:1.6;">
        Ready to order? Just reply to this email with your design files, or hit us up on Instagram <a href="https://instagram.com/weprintwraps" style="color:#0066cc;">@weprintwraps</a>!
      </p>
      
      <p style="color:#666;line-height:1.6;">
        Talk soon,<br>
        <strong>The WePrintWraps Team</strong>
      </p>
    </div>
    
    <div style="text-align:center;padding:20px;color:#999;font-size:12px;">
      <p>Quote #${quoteNumber}</p>
      <p>WePrintWraps • <a href="https://weprintwraps.com" style="color:#999;">weprintwraps.com</a></p>
    </div>
  </div>
</body>
</html>`;

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'WePrintWraps <hello@weprintwraps.com>',
            to: [customer_email],
            subject: `Your Wrap Quote: ${vehicleDisplay} - $${materialCost.toFixed(2)}`,
            html: emailHtml
          })
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('[CreateQuoteFromChat] Email sent successfully');
        } else {
          const errorText = await emailResponse.text();
          console.error('[CreateQuoteFromChat] Email send error:', errorText);
        }
      } catch (emailErr) {
        console.error('[CreateQuoteFromChat] Email error:', emailErr);
      }
    }

    // Log AI action
    await supabase
      .from('ai_actions')
      .insert({
        action_type: 'quote_created_from_chat',
        action_payload: {
          quote_id: quote.id,
          quote_number: quoteNumber,
          customer_email,
          vehicle: `${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''}`.trim(),
          sqft,
          material_cost: materialCost,
          email_sent: emailSent,
          conversation_id
        },
        organization_id,
        priority: 'normal',
        resolved: true,
        resolved_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({
      success: true,
      quote_id: quote.id,
      quote_number: quoteNumber,
      sqft,
      material_cost: materialCost,
      price_per_sqft: pricePerSqft,
      email_sent: emailSent,
      message: `Quote created and ${emailSent ? 'sent to ' + customer_email : 'ready for review'}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[CreateQuoteFromChat] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
