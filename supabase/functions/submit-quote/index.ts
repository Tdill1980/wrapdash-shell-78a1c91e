import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getVehicleSqFt } from "../_shared/mighty-vehicle-sqft.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wpw-embed-secret",
};

// WPW Pricing (from _shared/wpw-pricing.ts)
const WPW_PRICING = {
  averyPrintedWrap: { pricePerSqft: 5.25, name: "Avery Dennison MPI 1105 Printed Wrap" },
  threeMPrintedWrap: { pricePerSqft: 6.00, name: "3M IJ180cV3 Printed Wrap" },
};

// CommercialPro keywords for routing bulk/fleet to Jackson
const COMMERCIAL_PRO_KEYWORDS = ['fleet', 'bulk', 'volume', 'franchise', 'multiple', 'wall wrap', 'trailer', 'box truck', 'bus', 'van fleet'];

function calculateQuickQuote(sqft: number, material: string = 'Avery') {
  const productKey = material.toLowerCase().includes('3m') ? 'threeMPrintedWrap' : 'averyPrintedWrap';
  const product = WPW_PRICING[productKey];
  return {
    materialCost: sqft * product.pricePerSqft,
    pricePerSqft: product.pricePerSqft,
    productName: product.name,
  };
}

function isCommercialProLead(payload: SubmitQuotePayload): boolean {
  const notes = (payload.notes || '').toLowerCase();
  const category = (payload.category || '').toLowerCase();
  const sqft = payload.dimensions?.sqft || 0;
  
  // Check for keywords
  const hasKeyword = COMMERCIAL_PRO_KEYWORDS.some(kw => 
    notes.includes(kw) || category.includes(kw)
  );
  
  // Large sqft (over 260 = likely fleet/commercial)
  const isLargeSqft = sqft > 260;
  
  return hasKeyword || isLargeSqft;
}

function generateQuoteNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WPW-${yy}${mm}${dd}-${random}`;
}

interface SubmitQuotePayload {
  quote_id: string;
  email: string;
  phone?: string;
  name?: string;
  category?: string;
  vehicle?: { year?: string; make?: string; model?: string };
  dimensions?: { width?: number; height?: number; sqft?: number };
  material?: string;
  estimated_price?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  source?: string;
  notes?: string;
}

async function sendConfirmationEmail(resend: Resend, email: string, quoteNumber: string, price: number, vehicle?: any) {
  const vehicleText = vehicle?.year && vehicle?.make && vehicle?.model 
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` 
    : 'Your Vehicle';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1A1A; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #00AFFF 0%, #4EEAFF 100%); padding: 30px; text-align: center;">
              <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">Quote Received!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #FFFFFF; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Thanks for requesting a quote from WePrintWraps! We've received your request and are ready to get you wrapped.
              </p>
              
              <table width="100%" style="background-color: #252525; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td style="color: #888; font-size: 14px;">Quote Number</td>
                  <td style="color: #00AFFF; font-size: 16px; font-weight: bold; text-align: right;">${quoteNumber}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 14px; padding-top: 10px;">Vehicle</td>
                  <td style="color: #FFF; font-size: 16px; text-align: right; padding-top: 10px;">${vehicleText}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 14px; padding-top: 10px;">Estimated Price</td>
                  <td style="color: #4EEAFF; font-size: 20px; font-weight: bold; text-align: right; padding-top: 10px;">$${price.toFixed(2)}</td>
                </tr>
              </table>
              
              <p style="color: #FFFFFF; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Ready to move forward? Reply to this email or call us at <strong style="color: #00AFFF;">(555) 123-4567</strong>.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://weprintwraps.com" style="display: inline-block; background: linear-gradient(135deg, #00AFFF 0%, #4EEAFF 100%); color: #000; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      View Our Work
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0F0F0F; padding: 20px 30px; text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                © 2025 WePrintWraps. All rights reserved.<br>
                <a href="https://weprintwraps.com" style="color: #00AFFF; text-decoration: none;">weprintwraps.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await resend.emails.send({
    from: "WePrintWraps <hello@weprintwraps.com>",
    to: [email],
    subject: `Quote ${quoteNumber} - Your Wrap Estimate is Ready!`,
    html,
  });
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Validate embed secret
    const embedSecret = req.headers.get("x-wpw-embed-secret");
    const expectedSecret = Deno.env.get("WPW_EMBED_SECRET");
    
    if (!embedSecret || embedSecret !== expectedSecret) {
      console.error("Invalid or missing x-wpw-embed-secret header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: SubmitQuotePayload = await req.json();
    console.log("Received quote submission:", JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.email || !payload.quote_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: email and quote_id are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate quote number
    const quoteNumber = generateQuoteNumber();

    // Get authoritative sqft from MightyCommandAI engine (server-side validation)
    let sqft = payload.dimensions?.sqft || 0;
    let sqftSource = 'provided';
    
    // If sqft is missing or zero, lookup from authoritative source
    if (!sqft && payload.vehicle?.year && payload.vehicle?.make && payload.vehicle?.model) {
      console.log("[submit-quote] No sqft provided, looking up from MightyCommandAI...");
      const sqftResult = await getVehicleSqFt(
        supabase,
        payload.vehicle.year,
        payload.vehicle.make,
        payload.vehicle.model,
        payload.category
      );
      sqft = sqftResult.sqft;
      sqftSource = sqftResult.source;
      console.log(`[submit-quote] MightyCommandAI sqft: ${sqft} (source: ${sqftSource})`);
    }

    // Calculate pricing with authoritative sqft
    const pricing = calculateQuickQuote(sqft, payload.material || 'Avery');
    const estimatedPrice = sqft > 0 ? pricing.materialCost : (payload.estimated_price || 0);

    // Prepare quote data
    const quoteData = {
      id: payload.quote_id,
      quote_number: quoteNumber,
      customer_name: payload.name || 'Quote Request',
      customer_email: payload.email,
      customer_phone: payload.phone || null,
      vehicle_year: payload.vehicle?.year || null,
      vehicle_make: payload.vehicle?.make || null,
      vehicle_model: payload.vehicle?.model || null,
      category: payload.category || null,
      dimensions: payload.dimensions || {},
      sqft: sqft,
      product_name: pricing.productName,
      total_price: estimatedPrice,
      material_cost: pricing.materialCost,
      status: 'submitted',
      source: payload.source || 'external',
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      utm_content: payload.utm_content || null,
      auto_retarget: true,
      follow_up_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // UPSERT quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .upsert(quoteData, { onConflict: 'id' })
      .select()
      .single();

    if (quoteError) {
      console.error("Error upserting quote:", quoteError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save quote", details: quoteError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Quote saved successfully:", quote.id);

    // Send confirmation email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailResult = null;
    
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      try {
        emailResult = await sendConfirmationEmail(resend, payload.email, quoteNumber, estimatedPrice, payload.vehicle);
        console.log("Confirmation email sent:", emailResult);

        // Log to quote_retargeting_log
        await supabase.from('quote_retargeting_log').insert({
          quote_id: quote.id,
          email_type: 'confirmation',
          resend_id: emailResult.data?.id || null,
          status: 'sent',
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the whole request if email fails
      }
      
      // CommercialPro routing: Notify Jackson for bulk/fleet leads
      if (isCommercialProLead(payload)) {
        console.log("CommercialPro lead detected, notifying Jackson...");
        try {
          await resend.emails.send({
            from: "WePrintWraps <hello@weprintwraps.com>",
            to: ["jackson@weprintwraps.com"],
            subject: `🔥 CommercialPro Lead: ${payload.vehicle?.make || payload.category || 'New Quote'}`,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #FF1493; margin-bottom: 16px;">New CommercialPro Lead</h2>
  <p><strong>Quote #:</strong> ${quoteNumber}</p>
  <p><strong>Customer:</strong> ${payload.name || 'Not provided'} (${payload.email})</p>
  <p><strong>Phone:</strong> ${payload.phone || 'Not provided'}</p>
  <p><strong>Category:</strong> ${payload.category || 'Not specified'}</p>
  <p><strong>Vehicle:</strong> ${payload.vehicle?.year || ''} ${payload.vehicle?.make || ''} ${payload.vehicle?.model || ''}</p>
  <p><strong>Sq Ft:</strong> ${sqft || 'Not specified'}</p>
  <p><strong>Estimated Price:</strong> $${estimatedPrice.toFixed(2)}</p>
  <p><strong>Notes:</strong> ${payload.notes || 'None'}</p>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
  <p style="font-size: 12px; color: #666;">This lead was flagged as CommercialPro due to bulk/fleet keywords or large sqft.</p>
</div>`,
          });
          console.log("CommercialPro notification sent to Jackson");
        } catch (notifyErr) {
          console.error("Failed to notify Jackson:", notifyErr);
        }
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping confirmation email");
    }

    // Log to ai_actions for MCP visibility
    const isCommercial = isCommercialProLead(payload);
    await supabase.from('ai_actions').insert({
      action_type: isCommercial ? 'commercial_pro_quote_submitted' : 'external_quote_submitted',
      action_payload: {
        quote_id: quote.id,
        quote_number: quoteNumber,
        email: payload.email,
        source: payload.source,
        estimated_price: estimatedPrice,
        is_commercial_pro: isCommercial,
      },
      priority: isCommercial ? 'high' : 'normal',
    });

    return new Response(
      JSON.stringify({
        success: true,
        quote_id: quote.id,
        quote_number: quoteNumber,
        sqft: sqft,
        sqft_source: sqftSource,
        price: estimatedPrice,
        price_per_sqft: pricing.pricePerSqft,
        estimated_price: estimatedPrice,
        emailSent: !!emailResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in submit-quote:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
