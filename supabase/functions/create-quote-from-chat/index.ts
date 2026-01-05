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

    // Create quote record (using ONLY columns that exist in quotes table)
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
        total_price: materialCost,
        status: 'created', // Start as 'created', update to 'sent' after email
        source: 'website_chat',
        ai_generated: true,
        ai_sqft_estimate: sqft,
        ai_message: `Auto-generated from chat. ${product_type.toUpperCase()} material at $${pricePerSqft}/sqft.`,
        source_conversation_id: conversation_id || null,
        email_sent: false
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

    // Create MightyTask for Alex Morgan (quote follow-up) - using ONLY valid columns
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: `Quote Follow-Up: ${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''} - $${materialCost}`.trim(),
        description: `Website chat quote sent to ${customer_email}. Vehicle: ${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''} (${sqft} sqft). Material: $${materialCost}. Quote #${quoteNumber}. Conversation: ${conversation_id || 'N/A'}. Follow up to close!`,
        status: 'pending',
        priority: materialCost > 1500 ? 'high' : 'medium',
        assigned_to: 'alex_morgan',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        organization_id
      });

    if (taskError) {
      console.error('[CreateQuoteFromChat] Task creation error:', taskError);
    }

    // ============================================
    // CANONICAL QUOTE EMAIL - Claude-style with rotating upsells
    // ============================================
    
    // Rotating upsell helper (50/50 based on quote ID)
    function getRotatingUpsell(quoteId?: string) {
      const even = quoteId
        ? parseInt(quoteId.slice(-2), 16) % 2 === 0
        : Date.now() % 2 === 0;

      if (even) {
        return {
          title: "Need window coverage?",
          body: "Window Perf is available at $5.95 / sq ft.",
          link: "https://weprintwraps.com/product/perforated-window-vinyl/",
        };
      }

      return {
        title: "Need logos or decals to match?",
        body: "Cut Contour graphics start at $6.32 / sq ft.",
        link: "https://weprintwraps.com/product/avery-cut-contour-vehicle-wrap/",
      };
    }

    // Build canonical email HTML - WePrintWraps style
    function buildQuoteEmailHTML({
      quoteNumber,
      vehicleLabel,
      sqft,
      rate,
      total,
      cartUrl,
      quoteId,
    }: {
      quoteNumber: string;
      vehicleLabel: string;
      sqft: number;
      rate: number;
      total: number;
      cartUrl: string;
      quoteId?: string;
    }) {
      const upsell = getRotatingUpsell(quoteId);
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;">

    <!-- BLACK HEADER -->
    <div style="background:#000;color:#fff;padding:24px 32px;text-align:center;">
      <div style="font-size:20px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
        WEPRINTWRAPS.COM
      </div>
    </div>

    <!-- GREETING -->
    <div style="padding:32px 32px 16px 32px;">
      <p style="margin:0 0 8px 0;font-size:16px;font-weight:600;color:#1a1a1a;">
        Hi there,
      </p>
      <p style="margin:0;font-size:15px;color:#4a4a4a;line-height:1.6;">
        Thank you for requesting a quote. Here's your custom estimate:
      </p>
    </div>

    <!-- QUOTE HEADER -->
    <div style="padding:0 32px 24px 32px;">
      <div style="font-size:18px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;">
        VEHICLE WRAP QUOTE
      </div>
      <div style="height:3px;width:80px;background:#0066cc;margin-top:8px;"></div>
      <div style="font-size:13px;color:#666;margin-top:12px;">
        Quote #${quoteNumber} • Generated on ${today}
      </div>
    </div>

    <!-- PROJECT DETAILS -->
    <div style="padding:0 32px 24px 32px;">
      <div style="font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        PROJECT DETAILS
      </div>
      <div style="height:1px;background:#e5e5e5;margin-bottom:16px;"></div>
      
      <div style="margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:#1a1a1a;">Vehicle:</div>
        <div style="font-size:14px;color:#4a4a4a;">${vehicleLabel}</div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:#1a1a1a;">Total Area:</div>
        <div style="font-size:14px;color:#4a4a4a;">${sqft} sq ft</div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:600;color:#1a1a1a;">Material:</div>
        <div style="font-size:14px;color:#0066cc;">Premium Cast Vinyl with Lamination</div>
      </div>
    </div>

    <!-- PRICING BREAKDOWN -->
    <div style="padding:0 32px 24px 32px;">
      <div style="font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        PRICING BREAKDOWN
      </div>
      <div style="height:1px;background:#e5e5e5;margin-bottom:16px;"></div>
      
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="border-bottom:1px solid #e5e5e5;">
            <td style="padding:8px 0;font-weight:600;color:#666;">ITEM</td>
            <td style="padding:8px 0;text-align:center;font-weight:600;color:#666;">QTY</td>
            <td style="padding:8px 0;text-align:center;font-weight:600;color:#666;">UNIT PRICE</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#666;">AMOUNT</td>
          </tr>
          <tr>
            <td style="padding:12px 0;color:#1a1a1a;">Printed Wrap Material</td>
            <td style="padding:12px 0;text-align:center;color:#4a4a4a;">${sqft} sq ft</td>
            <td style="padding:12px 0;text-align:center;color:#4a4a4a;">$${rate.toFixed(2)}/sq ft</td>
            <td style="padding:12px 0;text-align:right;font-weight:600;color:#1a1a1a;">$${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- ESTIMATED TOTAL BOX -->
    <div style="padding:0 32px 24px 32px;">
      <div style="border:2px solid #e5e5e5;border-radius:8px;padding:24px;text-align:center;">
        <div style="font-size:12px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
          ESTIMATED TOTAL
        </div>
        <div style="font-size:36px;font-weight:700;color:#1a1a1a;">
          $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style="font-size:13px;color:#666;margin-top:8px;">
          ${sqft} sq ft × $${rate.toFixed(2)}/sq ft<br/>
          Material: Premium Cast Vinyl
        </div>
      </div>
    </div>

    <!-- ADD TO CART CTA -->
    <div style="padding:0 32px 32px 32px;text-align:center;">
      <a href="${cartUrl}"
         style="display:inline-block;padding:16px 48px;
                background:#0066cc;color:#fff;
                text-decoration:none;border-radius:6px;
                font-weight:600;font-size:15px;text-transform:uppercase;letter-spacing:0.5px;">
        Add to Cart
      </a>
    </div>

    <!-- QUALITY GUARANTEE -->
    <div style="padding:0 32px 24px 32px;">
      <div style="border-left:4px solid #0066cc;padding:16px 20px;background:#f8f9fa;">
        <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:4px;">
          ✓ Premium Wrap Guarantee
        </div>
        <div style="font-size:13px;color:#4a4a4a;line-height:1.5;">
          Industry-leading print quality on certified materials. Every wrap is inspected before shipping to ensure flawless results for your project.
        </div>
      </div>
    </div>

    <!-- ROTATING UPSELL -->
    <div style="padding:0 32px 24px 32px;">
      <div style="font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        RECOMMENDED ADD-ONS
      </div>
      <div style="height:1px;background:#e5e5e5;margin-bottom:16px;"></div>
      
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:20px;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">
          ${upsell.title.replace('?', '')}
        </div>
        <div style="font-size:13px;color:#4a4a4a;line-height:1.5;margin-bottom:12px;">
          ${upsell.body}
        </div>
        <a href="${upsell.link}" style="font-size:13px;color:#0066cc;text-decoration:none;font-weight:600;">
          Learn more →
        </a>
      </div>
    </div>

    <!-- VOLUME PRICING -->
    <div style="padding:0 32px 24px 32px;">
      <div style="font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        VOLUME & FLEET PRICING
      </div>
      <div style="height:1px;background:#e5e5e5;margin-bottom:16px;"></div>
      <ul style="margin:0;padding-left:20px;color:#4a4a4a;font-size:13px;line-height:1.8;">
        <li>500–999 sq ft → 5% off</li>
        <li>1,000–2,499 sq ft → 10% off</li>
        <li>2,500–4,999 sq ft → 15% off</li>
        <li>5,000+ sq ft → 20% off</li>
      </ul>
    </div>

    <!-- NEXT STEPS -->
    <div style="padding:0 32px 24px 32px;">
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:20px;">
        <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:12px;">
          Next Steps:
        </div>
        <ol style="margin:0;padding-left:20px;color:#4a4a4a;font-size:13px;line-height:1.8;">
          <li><strong>Review your quote</strong> — Confirm all details</li>
          <li><strong>Add to cart</strong> — Click the button above</li>
          <li><strong>Upload artwork</strong> — We'll review and confirm</li>
        </ol>
      </div>
    </div>

    <!-- COMMERCIALPRO CTA -->
    <div style="padding:0 32px 24px 32px;">
      <div style="background:#f8f9fa;border-radius:8px;padding:20px;text-align:center;">
        <div style="font-size:14px;color:#4a4a4a;margin-bottom:8px;">
          Are you a wrap professional or managing fleet volume?
        </div>
        <a href="https://weprintwraps.com/commercialpro"
           style="font-size:13px;color:#0066cc;text-decoration:none;font-weight:600;">
          Learn more about CommercialPro™ →
        </a>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="padding:24px 32px;background:#f5f5f5;font-size:12px;color:#666;text-align:center;">
      Questions? Reply to this email or contact
      <a href="mailto:hello@weprintwraps.com" style="color:#0066cc;">hello@weprintwraps.com</a><br/><br/>
      — The WePrintWraps.com Team<br/>
      <span style="font-size:11px;color:#999;">Quote #${quoteNumber}</span>
    </div>

  </div>
</body>
</html>
`;
    }

    // Send quote email
    let emailSent = false;
    if (send_email && resendKey) {
      const vehicleDisplay = `${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''}`.trim() || 'Your Vehicle';
      
      // Cart URL - link to products page (can be enhanced with WooCommerce cart URL later)
      const cartUrl = 'https://weprintwraps.com/our-products/';

      const emailHtml = buildQuoteEmailHTML({
        quoteNumber,
        vehicleLabel: vehicleDisplay,
        sqft,
        rate: pricePerSqft,
        total: materialCost,
        cartUrl,
        quoteId: quote.id,
      });

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
          
          // Update quote record: email_sent = true AND status = 'sent'
          const { error: updateError } = await supabase
            .from('quotes')
            .update({ email_sent: true, status: 'sent' })
            .eq('id', quote.id);
          
          if (updateError) {
            console.error('[CreateQuoteFromChat] Failed to update quote after email:', updateError);
          }
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
