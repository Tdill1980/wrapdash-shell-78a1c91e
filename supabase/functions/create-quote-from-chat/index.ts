// Create Quote from Chat - Generates and sends quote from website chat
// Called when Jordan has collected email + vehicle info
// Creates quote record, sends email, creates follow-up task
// OS SPINE: Logs quote_drafted and email_sent events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { WPW_PRICING, calculateQuickQuote } from "../_shared/wpw-pricing.ts";
import { logConversationEvent, logQuoteEvent } from "../_shared/conversation-events.ts";

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
  // HD TRUCKS (CRITICAL - These were missing and blocking quotes!)
  'f450': 300, 'f-450': 300, 'f550': 320, 'f-550': 320, 'f650': 350, 'f-650': 350,
  'silverado 2500': 280, 'silverado 2500hd': 280, 'silverado2500': 280,
  'silverado 3500': 300, 'silverado 3500hd': 300, 'silverado3500': 300,
  'silverado 4500': 320, 'silverado 4500hd': 320, 'silverado4500': 320,
  'silverado 5500': 340, 'silverado 5500hd': 340, 'silverado5500': 340,
  'silverado 6500': 360, 'silverado 6500hd': 360, 'silverado6500': 360,
  'sierra 2500': 280, 'sierra 2500hd': 280, 'sierra2500': 280,
  'sierra 3500': 300, 'sierra 3500hd': 300, 'sierra3500': 300,
  'ram 2500': 280, 'ram2500': 280,
  'ram 3500': 300, 'ram3500': 300,
  'ram 4500': 320, 'ram4500': 320,
  'ram 5500': 340, 'ram5500': 340,
  // Large SUVs
  'tahoe': 275, 'expedition': 275, 'suburban': 300, 'yukon': 275,
  'sequoia': 275, 'armada': 275, 'escalade': 275, 'navigator': 275,
  // Cargo vans
  'transit': 350, 'sprinter': 350, 'promaster': 350, 'express': 300, 'savana': 300,
  // Sprinter variants by wheelbase
  'sprinter 144': 280, 'sprinter 170': 320, 'sprinter 170 ext': 360,
  'transit 130': 260, 'transit 148': 300, 'transit 148 ext': 350,
  // Box trucks
  'box truck': 400, 'boxtruck': 400,
  'npr': 320, 'isuzu npr': 320, 'nqr': 350, 'isuzu nqr': 350, 'nrr': 380, 'isuzu nrr': 380,
  'hino': 350, 'fuso': 350, 'canter': 320,
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

// COMMERCIAL VEHICLE FALLBACK ESTIMATES (never block silently!)
const COMMERCIAL_FALLBACK_SQFT: Record<string, number> = {
  'hd_truck': 300,      // HD trucks (4500, 5500, 6500 series)
  'box_truck': 380,     // Box trucks / cab chassis
  'commercial_van': 320, // Commercial vans
  'chassis_cab': 300,   // Chassis cab
  'default': 275,       // Safe default for unknown commercial
};

interface SqftResult {
  sqft: number;
  source: 'exact' | 'pattern' | 'commercial_fallback' | 'default_fallback';
  needsReview: boolean;
}

function getVehicleSqft(make: string, model: string): SqftResult {
  const modelLower = model.toLowerCase().replace(/\s+/g, '');
  const modelWithSpaces = model.toLowerCase();
  const modelNormalized = model.toLowerCase().replace(/[\s-]+/g, ' ').trim();
  
  // Check exact match first
  if (VEHICLE_SQFT[modelLower]) {
    return { sqft: VEHICLE_SQFT[modelLower], source: 'exact', needsReview: false };
  }
  if (VEHICLE_SQFT[modelWithSpaces]) {
    return { sqft: VEHICLE_SQFT[modelWithSpaces], source: 'exact', needsReview: false };
  }
  if (VEHICLE_SQFT[modelNormalized]) {
    return { sqft: VEHICLE_SQFT[modelNormalized], source: 'exact', needsReview: false };
  }
  
  // Check partial matches
  for (const [key, sqft] of Object.entries(VEHICLE_SQFT)) {
    if (modelLower.includes(key) || key.includes(modelLower)) {
      return { sqft, source: 'pattern', needsReview: false };
    }
  }
  
  // Pattern-based fallbacks for commercial vehicles
  // HD Trucks (4500, 5500, 6500 series)
  if (/4500|5500|6500/i.test(model)) {
    console.log('[SQFT FALLBACK] HD truck detected:', model);
    return { sqft: COMMERCIAL_FALLBACK_SQFT.hd_truck, source: 'commercial_fallback', needsReview: true };
  }
  
  // Box trucks / Isuzu / Hino / Fuso
  if (/box|npr|nqr|nrr|hino|fuso|canter|cabover|cab.?over/i.test(model)) {
    console.log('[SQFT FALLBACK] Box truck detected:', model);
    return { sqft: COMMERCIAL_FALLBACK_SQFT.box_truck, source: 'commercial_fallback', needsReview: true };
  }
  
  // Commercial vans
  if (/van|sprinter|transit|promaster|express|savana|nv\d/i.test(model)) {
    console.log('[SQFT FALLBACK] Commercial van detected:', model);
    return { sqft: COMMERCIAL_FALLBACK_SQFT.commercial_van, source: 'commercial_fallback', needsReview: true };
  }
  
  // Chassis cab / work trucks
  if (/chassis|work.?truck|flatbed|stake|dump|utility/i.test(model)) {
    console.log('[SQFT FALLBACK] Chassis/work truck detected:', model);
    return { sqft: COMMERCIAL_FALLBACK_SQFT.chassis_cab, source: 'commercial_fallback', needsReview: true };
  }
  
  // Regular trucks
  if (/truck|f-?\d{3}|silverado|sierra|ram|tundra|titan/i.test(model)) {
    return { sqft: 250, source: 'pattern', needsReview: false };
  }
  
  // SUVs
  if (/suv|tahoe|expedition|suburban|yukon|explorer|pilot/i.test(model)) {
    return { sqft: 275, source: 'pattern', needsReview: false };
  }
  
  // ✅ NEVER BLOCK QUOTE CREATION - Always return a fallback with review flag
  console.log('[SQFT FALLBACK] Unknown vehicle, using safe default:', { make, model });
  return { sqft: COMMERCIAL_FALLBACK_SQFT.default, source: 'default_fallback', needsReview: true };
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
      product_type = 'avery_wrap',
      product_id = 79,
      product_name: passedProductName,
      product_price = 5.27,
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

    // Calculate SQFT and pricing - NEVER BLOCK, always create quote
    const sqftResult = getVehicleSqft(vehicle_make || '', vehicle_model || '');
    const sqft = sqftResult.sqft;
    const needsReview = sqftResult.needsReview;
    
    console.log('[CreateQuoteFromChat] SQFT lookup:', {
      vehicle: `${vehicle_year} ${vehicle_make} ${vehicle_model}`,
      sqft,
      source: sqftResult.source,
      needsReview
    });
    
    // Use passed product price or default to $5.27
    const pricePerSqft = product_price || 5.27;
    const materialCost = Math.round(sqft * pricePerSqft * 100) / 100;
    const quoteNumber = generateQuoteNumber();

    // Use passed product name or derive from product_type
    const productName = passedProductName || (product_type === '3m' || product_type === 'threem_wrap'
      ? '3M IJ180Cv3 with 8518'
      : 'Avery MPI 1105 with DOL 1460Z');

    console.log('[CreateQuoteFromChat] Calculated:', { sqft, pricePerSqft, materialCost, quoteNumber, needsReview });

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
        product_name: productName,
        status: 'created', // Start as 'created', update to 'sent' after email
        source: 'website_chat',
        ai_generated: true,
        ai_sqft_estimate: sqft,
        ai_message: needsReview 
          ? `⚠️ SQFT estimated (~${sqft} sqft). Vehicle "${vehicle_model}" not in database - manual review recommended. ${product_type.toUpperCase()} material at $${pricePerSqft}/sqft.`
          : `Auto-generated from chat. ${product_type.toUpperCase()} material at $${pricePerSqft}/sqft.`,
        source_conversation_id: conversation_id || null,
        email_sent: false
        // Note: needs_review flag is captured in ai_message field above
      })
      .select()
      .single();

    if (quoteError) {
      console.error('[CreateQuoteFromChat] Quote creation error:', quoteError);
      // Return explicit failure response instead of throwing
      return new Response(JSON.stringify({ 
        success: false, 
        error: quoteError.message,
        code: 'QUOTE_INSERT_FAILED'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[CreateQuoteFromChat] Quote created:', quote.id);

    // ============================================
    // OS SPINE: Log quote_drafted event
    // ============================================
    if (conversation_id) {
      await logQuoteEvent(
        supabase,
        conversation_id,
        'quote_drafted',
        {
          quoteId: quote.id,
          quoteNumber,
          total: materialCost,
          customerEmail: customer_email,
          customerName: customer_name,
          vehicleInfo: `${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''}`.trim(),
        }
      );
      console.log('[CreateQuoteFromChat] quote_drafted event logged');
    }

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
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;">

    <!-- BLACK HEADER -->
    <div style="background:#000000;padding:16px 24px;">
      <div style="font-size:16px;font-weight:600;color:#ffffff;">
        WePrintWraps.com Quote
      </div>
    </div>

    <!-- BODY RESET -->
    <div style="background:#ffffff;color:#111827;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.5;">

      <!-- ADD TO CART -->
      <div style="padding:24px;">
        <a href="${cartUrl}"
           style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
          Add This Quote to Cart
        </a>
      </div>

      <!-- PRICE -->
      <div style="padding:0 24px 24px 24px;">
        <div style="font-size:13px;color:#6b7280;">Estimated Total</div>
        <div style="font-size:26px;font-weight:700;color:#111827;">
          $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style="font-size:13px;color:#6b7280;">
          ~${sqft} sq ft × $${rate.toFixed(2)} / sq ft
        </div>
      </div>

      <!-- PROJECT DETAILS -->
      <div style="padding:0 24px 24px 24px;">
        <div style="font-size:13px;color:#111827;font-weight:600;margin-bottom:4px;">Project Details</div>
        <div style="font-size:13px;color:#6b7280;">
          <strong>Vehicle:</strong> ${vehicleLabel}<br/>
          <strong>Coverage:</strong> ${sqft} sq ft<br/>
          <strong>Material:</strong> Premium Cast Vinyl<br/>
          <em style="color:#9ca3af;">Printed wrap material only. Installation not included.</em>
        </div>
      </div>

      <!-- UPSELL -->
      <div style="padding:0 24px 24px 24px;">
        <div style="background:#f9fafb;border-radius:8px;padding:16px;">
          <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:4px;">${upsell.title}</div>
          <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">${upsell.body}</div>
          <a href="${upsell.link}" style="font-size:13px;color:#2563eb;text-decoration:none;">Learn more →</a>
        </div>
      </div>

      <!-- VOLUME PRICING -->
      <div style="padding:0 24px 24px 24px;">
        <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:8px;">Volume & Fleet Pricing</div>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#6b7280;line-height:1.8;">
          <li>500–999 sq ft → 5% off</li>
          <li>1,000–2,499 sq ft → 10% off</li>
          <li>2,500–4,999 sq ft → 15% off</li>
          <li>5,000+ sq ft → 20% off</li>
        </ul>
      </div>

      <!-- COMMERCIALPRO -->
      <div style="padding:0 24px 24px 24px;border-top:1px solid #e5e7eb;">
        <div style="padding-top:16px;font-size:13px;color:#6b7280;">
          Are you a wrap professional or managing fleet volume?<br/>
          <a href="https://weprintwraps.com/commercialpro" style="color:#2563eb;text-decoration:none;font-weight:600;">
            Learn more about CommercialPro™ →
          </a>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="padding:24px;background:#f6f7f9;font-size:12px;color:#6b7280;text-align:center;">
        Questions? Reply to this email or contact
        <a href="mailto:hello@weprintwraps.com" style="color:#2563eb;">hello@weprintwraps.com</a><br/><br/>
        — The WePrintWraps.com Team<br/>
        <span style="font-size:11px;color:#9ca3af;">Quote #${quoteNumber}</span>
      </div>

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
          
          // ============================================
          // OS SPINE: Log email_sent event
          // ============================================
          if (conversation_id) {
            await logConversationEvent(
              supabase,
              conversation_id,
              'email_sent',
              'jordan_lee',
              {
                email_sent_to: [customer_email],
                email_sent_at: new Date().toISOString(),
                email_subject: `Your Wrap Quote: ${vehicleDisplay} - $${materialCost.toFixed(2)}`,
                quote_id: quote.id,
                quote_number: quoteNumber,
                customer_email: customer_email,
              },
              'quote'
            );
            console.log('[CreateQuoteFromChat] email_sent event logged');
          }
          
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

    // ============================================
    // MIGHTYMAIL WIRING: Enroll in email sequence
    // ============================================
    if (customer_email && !customer_email.includes('@capture.local')) {
      try {
        // Get or find contact
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', customer_email.toLowerCase())
          .eq('organization_id', organization_id)
          .maybeSingle();

        if (contact) {
          // Find quote follow-up sequence
          const { data: sequence } = await supabase
            .from('email_sequences')
            .select('id')
            .ilike('name', '%quote%follow%')
            .eq('is_active', true)
            .maybeSingle();

          if (sequence) {
            // Check if not already enrolled
            const { data: existingEnrollment } = await supabase
              .from('email_sequence_enrollments')
              .select('id')
              .eq('customer_email', customer_email)
              .eq('sequence_id', sequence.id)
              .eq('is_active', true)
              .maybeSingle();

            if (!existingEnrollment) {
              await supabase.from('email_sequence_enrollments').insert({
                contact_id: contact.id,
                quote_id: quote.id,
                sequence_id: sequence.id,
                customer_email: customer_email,
                customer_name: customer_name || 'Website Lead',
                enrolled_at: new Date().toISOString(),
                emails_sent: 0,
                is_active: true
              });
              console.log(`[MightyMail] Enrolled ${customer_email} in quote follow-up sequence`);
            }
          }
        }
      } catch (mailError) {
        console.warn('[MightyMail] Enrollment warning (non-blocking):', mailError);
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
