import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  customerEmail: string;
  customerName: string;
  quoteData: {
    vehicle_year?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    product_name?: string;
    sqft?: number;
    material_cost?: number;
    labor_cost?: number;
    quote_total: number;
    portal_url?: string;
  };
  tone?: string;
  design?: string;
  quoteId?: string;
  customerId?: string;
  offersInstallation?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      quoteData,
      tone = "installer",
      design = "performance",
      quoteId,
      customerId,
      offersInstallation = true,
    }: QuoteEmailRequest = await req.json();

    if (!customerEmail || !quoteData.quote_total) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get branding settings
    const { data: branding } = await supabase
      .from("email_branding")
      .select("*")
      .single();

    // Generate UTIM for tracking
    const emailId = crypto.randomUUID();
    const utim = quoteId && customerId 
      ? btoa(`${customerId}:${quoteId}:quote_sent:${emailId}:${Date.now()}:${tone}:${design}:mightymail`)
      : '';

    let emailHTML = renderEmailTemplate(tone, design, {
      customer_name: customerName,
      footer_text: branding?.footer_text || "",
      logo_url: branding?.logo_url || "",
      ...quoteData,
    }, offersInstallation);

    const subject = getSubjectLine(tone, quoteData);

    // Inject UTIM tracking if available
    if (utim) {
      const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '') || '';
      emailHTML = emailHTML.replace(/\{\{utim\}\}/g, utim);
      
      // Add tracking pixel
      const trackingPixel = `<img src="${baseUrl}/functions/v1/track-email-open?utim=${utim}" width="1" height="1" style="display:none;" alt="" />`;
      emailHTML = emailHTML.replace('</body>', `${trackingPixel}</body>`);
    }

    const emailResponse = await resend.emails.send({
      from: branding?.sender_name
        ? `${branding.sender_name} <hello@weprintwraps.com>`
        : "WePrintWraps <hello@weprintwraps.com>",
      to: [customerEmail],
      subject: subject,
      html: emailHTML,
    });

    // Log email send
    await supabase.from("email_tracking").insert({
      customer_id: null,
      sequence_id: null,
      email_subject: subject,
      status: "sent",
      metadata: {
        tone,
        design,
        quote_total: quoteData.quote_total,
      },
    });

    console.log("Quote email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-mightymail-quote function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getSubjectLine(tone: string, quoteData: any): string {
  const vehicleDisplay = [quoteData.vehicle_year, quoteData.vehicle_make, quoteData.vehicle_model]
    .filter(Boolean)
    .join(' ') || 'Your Vehicle';
  
  return `Your Wrap Quote: ${vehicleDisplay} - $${Number(quoteData.quote_total).toFixed(2)}`;
}

// ============================================
// CANONICAL QUOTE EMAIL - Claude-style with rotating upsells
// Unified template matching create-quote-from-chat
// ============================================

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

function renderEmailTemplate(
  tone: string,
  design: string,
  data: Record<string, any>,
  offersInstallation: boolean = true
): string {
  const vehicleDisplay = [data.vehicle_year, data.vehicle_make, data.vehicle_model]
    .filter(Boolean)
    .join(' ') || 'Your Vehicle';

  const cartUrl = data.portal_url || 'https://weprintwraps.com/our-products/';
  const total = Number(data.quote_total) || 0;
  const sqft = Number(data.sqft) || 0;
  const rate = sqft > 0 ? total / sqft : 5.27;
  const quoteNumber = data.quote_number || '';
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const upsell = getRotatingUpsell(data.quote_id);

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
        Hi${data.customer_name ? ' ' + data.customer_name.split(' ')[0] : ''},
      </p>
      <p style="margin:0;font-size:15px;color:#4a4a4a;line-height:1.6;">
        Thank you for requesting a quote. Here's your custom estimate:
      </p>
    </div>

    <!-- QUOTE HEADER -->
    <div style="padding:0 32px 24px 32px;">
      <div style="font-size:18px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;">
        ${data.product_name ? data.product_name.toUpperCase() + ' QUOTE' : 'VEHICLE WRAP QUOTE'}
      </div>
      <div style="height:3px;width:80px;background:#0066cc;margin-top:8px;"></div>
      ${quoteNumber ? `<div style="font-size:13px;color:#666;margin-top:12px;">Quote #${quoteNumber} • Generated on ${today}</div>` : ''}
    </div>

    <!-- PROJECT DETAILS -->
    <div style="padding:0 32px 24px 32px;">
      <div style="font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        PROJECT DETAILS
      </div>
      <div style="height:1px;background:#e5e5e5;margin-bottom:16px;"></div>
      
      <div style="margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:#1a1a1a;">Project Type:</div>
        <div style="font-size:14px;color:#4a4a4a;">${data.product_name || 'Vehicle Wrap'}</div>
      </div>
      ${vehicleDisplay !== 'Your Vehicle' ? `
      <div style="margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:#1a1a1a;">Vehicle:</div>
        <div style="font-size:14px;color:#4a4a4a;">${vehicleDisplay}</div>
      </div>
      ` : ''}
      ${sqft > 0 ? `
      <div style="margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:#1a1a1a;">Total Area:</div>
        <div style="font-size:14px;color:#4a4a4a;">${sqft} sq ft</div>
      </div>
      ` : ''}
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
            <td style="padding:12px 0;color:#1a1a1a;">${data.product_name || 'Printed Wrap Material'}</td>
            <td style="padding:12px 0;text-align:center;color:#4a4a4a;">${sqft > 0 ? sqft + ' sq ft' : '1'}</td>
            <td style="padding:12px 0;text-align:center;color:#4a4a4a;">${sqft > 0 ? '$' + rate.toFixed(2) + '/sq ft' : '-'}</td>
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
        ${sqft > 0 ? `
        <div style="font-size:13px;color:#666;margin-top:8px;">
          ${sqft} sq ft × $${rate.toFixed(2)}/sq ft<br/>
          Material: Premium Cast Vinyl
        </div>
        ` : ''}
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
      ${quoteNumber ? `<span style="font-size:11px;color:#999;">Quote #${quoteNumber}</span>` : ''}
    </div>

  </div>
</body>
</html>
`;
}

// Legacy functions kept for compatibility but not used in new template
function getTonePreset(tone: string, offersInstallation: boolean) {
  return { buttonColor: "#0ea5e9", accentColor: "#60A5FA" };
}

function getDesignStyles(design: string) {
  return {
    backgroundColor: "#f6f7f9",
    containerColor: "#FFFFFF",
    headerGradient: "#000000",
    textColor: "#334155",
    headingColor: "#0f172a",
    bodyColor: "#64748b",
    cardColor: "#FFFFFF",
    borderColor: "#e5e7eb",
    footerColor: "#64748b",
    priceBoxGradient: "#0ea5e9",
  };
}

serve(handler);
