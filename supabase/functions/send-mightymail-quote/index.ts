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
  const templates: Record<string, string> = {
    installer: `Your Vehicle Wrap Quote for ${quoteData.vehicle_make || "Your Vehicle"} ${quoteData.vehicle_model || ""}`,
    luxury: "Your Premium Wrap Experience Awaits",
    hype: "🔥 Your Wrap Quote is Ready — Let's Transform This Ride!",
  };
  
  return templates[tone] || templates.installer;
}

function renderEmailTemplate(
  tone: string,
  design: string,
  data: Record<string, any>,
  offersInstallation: boolean = true
): string {
  const styles = getDesignStyles(design);
  const tonePreset = getTonePreset(tone, offersInstallation);
  
  const vehicleDisplay = [data.vehicle_year, data.vehicle_make, data.vehicle_model]
    .filter(Boolean)
    .join(' ');

  const orderLink = data.portal_url || 'https://weprintwraps.com';
  const commercialLink = 'https://weprintwraps.com/pages/commercialpro';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Montserrat', 'Poppins', Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: ${styles.backgroundColor}; 
            -webkit-font-smoothing: antialiased;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: ${styles.containerColor}; 
          }
          .header { 
            background: ${styles.headerGradient}; 
            padding: 32px 20px; 
            text-align: center; 
          }
          .header-brand { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700;
            font-family: 'Poppins', Arial, sans-serif;
            letter-spacing: -0.5px;
          }
          .header-tagline {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            margin-top: 8px;
            font-weight: 400;
          }
          .content { 
            padding: 32px 24px; 
            color: ${styles.textColor}; 
          }
          .section-title {
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 22px;
            font-weight: 700;
            color: ${styles.headingColor};
            margin: 0 0 8px 0;
          }
          .quote-number {
            color: ${styles.bodyColor};
            font-size: 14px;
            margin-bottom: 24px;
          }
          .quote-table {
            width: 100%;
            background-color: ${styles.cardColor};
            border-radius: 8px;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .quote-table td {
            padding: 12px 16px;
            border-bottom: 1px solid ${styles.borderColor};
            font-size: 14px;
          }
          .quote-table tr:last-child td {
            border-bottom: none;
          }
          .quote-table .label {
            color: ${styles.bodyColor};
            font-weight: 500;
          }
          .quote-table .value {
            color: ${styles.headingColor};
            font-weight: 600;
            text-align: right;
          }
          .price-box {
            background: ${styles.priceBoxGradient || 'linear-gradient(135deg, #00AFFF 0%, #0066CC 100%)'};
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
          }
          .price-label {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .price-amount {
            color: white;
            font-size: 42px;
            font-weight: 700;
            font-family: 'Poppins', Arial, sans-serif;
          }
          .price-note {
            color: rgba(255,255,255,0.8);
            font-size: 12px;
            margin-top: 8px;
          }
          .cta-button { 
            display: block;
            width: 100%;
            max-width: 280px;
            margin: 24px auto;
            padding: 16px 32px; 
            background: ${tonePreset.buttonColor}; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 700; 
            font-size: 16px;
            text-align: center;
            font-family: 'Poppins', Arial, sans-serif;
          }
          .benefits-box {
            background-color: ${styles.cardColor};
            border-radius: 8px;
            padding: 20px 24px;
            margin: 24px 0;
          }
          .benefits-title {
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: ${styles.headingColor};
            margin: 0 0 16px 0;
          }
          .benefit-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
            font-size: 14px;
            color: ${styles.bodyColor};
          }
          .benefit-check {
            color: #10B981;
            margin-right: 10px;
            font-weight: bold;
          }
          .commercial-box {
            background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(184,134,11,0.1) 100%);
            border: 1px solid rgba(212,175,55,0.3);
            border-radius: 8px;
            padding: 20px 24px;
            margin: 24px 0;
            text-align: center;
          }
          .commercial-title {
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: ${styles.headingColor};
            margin: 0 0 8px 0;
          }
          .commercial-text {
            font-size: 14px;
            color: ${styles.bodyColor};
            margin-bottom: 12px;
          }
          .commercial-link {
            color: #D4AF37;
            font-weight: 600;
            text-decoration: none;
          }
          .faq-section {
            margin: 32px 0 24px 0;
          }
          .faq-title {
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: ${styles.headingColor};
            margin: 0 0 16px 0;
          }
          .faq-item {
            margin-bottom: 16px;
          }
          .faq-question {
            font-size: 14px;
            font-weight: 600;
            color: ${styles.headingColor};
            margin-bottom: 4px;
          }
          .faq-answer {
            font-size: 13px;
            color: ${styles.bodyColor};
            line-height: 1.5;
          }
          .footer { 
            padding: 24px; 
            text-align: center; 
            color: ${styles.footerColor}; 
            font-size: 12px; 
            border-top: 1px solid ${styles.borderColor}; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">WePrintWraps.com</div>
            <div class="header-tagline">Print-Only Wholesale Wrap Pricing</div>
          </div>
          
          <div class="content">
            <div class="section-title">Your Wrap Quote</div>
            ${data.quote_number ? `<div class="quote-number">Quote #: ${data.quote_number}</div>` : ''}
            
            <table class="quote-table">
              ${vehicleDisplay ? `<tr><td class="label">Vehicle</td><td class="value">${vehicleDisplay}</td></tr>` : ''}
              <tr><td class="label">Coverage</td><td class="value">Full Wrap</td></tr>
              ${data.product_name ? `<tr><td class="label">Material</td><td class="value">${data.product_name}</td></tr>` : ''}
              ${data.sqft ? `<tr><td class="label">Square Footage</td><td class="value">${data.sqft} sq ft</td></tr>` : ''}
            </table>
            
            <div class="price-box">
              <div class="price-label">Print-Only Total</div>
              <div class="price-amount">$${Number(data.quote_total).toFixed(2)}</div>
              <div class="price-note">Installation not included</div>
            </div>
            
            <a href="${orderLink}" class="cta-button">ORDER NOW</a>
            
            <div class="benefits-box">
              <div class="benefits-title">Why WePrintWraps?</div>
              <div class="benefit-item"><span class="benefit-check">✓</span> Premium Wrap Guarantee – color accuracy & print quality</div>
              <div class="benefit-item"><span class="benefit-check">✓</span> Fast 1–2 Day Production</div>
              <div class="benefit-item"><span class="benefit-check">✓</span> Free Shipping on orders $750+</div>
            </div>
            
            <div class="commercial-box">
              <div class="commercial-title">Need a bulk or fleet order?</div>
              <div class="commercial-text">Volume discounts available for multiple vehicles or repeat production.</div>
              <a href="${commercialLink}" class="commercial-link">View CommercialPro →</a>
            </div>
            
            <div class="faq-section">
              <div class="faq-title">FAQs</div>
              <div class="faq-item">
                <div class="faq-question">Is installation included?</div>
                <div class="faq-answer">No — WePrintWraps.com provides print-only wholesale wrap material.</div>
              </div>
              <div class="faq-item">
                <div class="faq-question">How fast is production?</div>
                <div class="faq-answer">Most orders ship within 1–2 business days.</div>
              </div>
              <div class="faq-item">
                <div class="faq-question">Can I reorder this wrap?</div>
                <div class="faq-answer">Yes — your quote number allows easy reorders.</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} WePrintWraps.com - Premium Vehicle Wrap Printing</p>
            ${data.footer_text ? `<p>${data.footer_text}</p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

function getTonePreset(tone: string, offersInstallation: boolean) {
  const presets: Record<string, { buttonColor: string; accentColor: string }> = {
    installer: { buttonColor: "#00AFFF", accentColor: "#60A5FA" },
    luxury: { buttonColor: "#D4AF37", accentColor: "#F59E0B" },
    hype: { buttonColor: "#00AFFF", accentColor: "#4EEAFF" },
  };
  return presets[tone] || presets.installer;
}

function getDesignStyles(design: string) {
  const themes: Record<string, any> = {
    clean: {
      backgroundColor: "#F7F7F7",
      containerColor: "#FFFFFF",
      headerGradient: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
      textColor: "#111827",
      headingColor: "#111827",
      bodyColor: "#6B7280",
      cardColor: "#F9FAFB",
      borderColor: "#E5E7EB",
      footerColor: "#6B7280",
      priceBoxGradient: "linear-gradient(135deg, #00AFFF 0%, #0066CC 100%)",
    },
    luxury: {
      backgroundColor: "#0A0A0F",
      containerColor: "#16161E",
      headerGradient: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
      textColor: "#E7E7EF",
      headingColor: "#FFFFFF",
      bodyColor: "#B8B8C7",
      cardColor: "#1A1A1F",
      borderColor: "rgba(255,255,255,0.08)",
      footerColor: "#6B7280",
      priceBoxGradient: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
    },
    performance: {
      backgroundColor: "#0A0A0F",
      containerColor: "#16161E",
      headerGradient: "linear-gradient(135deg, #00AFFF 0%, #0066CC 100%)",
      textColor: "#E7E7EF",
      headingColor: "#FFFFFF",
      bodyColor: "#B8B8C7",
      cardColor: "#101016",
      borderColor: "rgba(255,255,255,0.08)",
      footerColor: "#6B7280",
      priceBoxGradient: "linear-gradient(135deg, #00AFFF 0%, #0066CC 100%)",
    },
  };

  return themes[design] || themes.performance;
}

serve(handler);
