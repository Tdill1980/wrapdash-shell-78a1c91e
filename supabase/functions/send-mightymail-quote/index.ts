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

    const emailHTML = renderEmailTemplate(tone, design, {
      customer_name: customerName,
      footer_text: branding?.footer_text || "",
      logo_url: branding?.logo_url || "",
      ...quoteData,
    });

    const subject = getSubjectLine(tone, quoteData);

    const emailResponse = await resend.emails.send({
      from: branding?.sender_name
        ? `${branding.sender_name} <onboarding@resend.dev>`
        : "MightyMail <onboarding@resend.dev>",
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
  data: Record<string, any>
): string {
  const tonePresets: Record<string, any> = {
    installer: {
      bodyParagraphs: [
        "Your estimate is now ready with precise material and installation details.",
        "All film selections are made using industry-standard materials and professional specifications.",
        "This quote includes accurate SQFT calculations, install hour estimates, and warranty-backed film options.",
        "If you have any questions regarding fitment, panel layout, or film performance, we're here to help.",
      ],
      closing: "Thanks for trusting us with your vehicle wrap project.",
      buttonColor: "#3B82F6",
      accentColor: "#60A5FA",
    },
    luxury: {
      bodyParagraphs: [
        "Your personalized wrap proposal has been prepared with elevated attention to detail.",
        "We've curated this recommendation using top-tier films and premium installation techniques.",
        "Every element—finish, coverage, and craftsmanship—has been considered to deliver a refined, elevated transformation.",
        "We look forward to creating a truly bespoke wrap experience for your vehicle.",
      ],
      closing: "Your vehicle deserves a flawless finish — let's bring it to life.",
      buttonColor: "#D4AF37",
      accentColor: "#F59E0B",
    },
    hype: {
      bodyParagraphs: [
        "Your custom wrap estimate is ready and it goes HARD.",
        "This setup was built to stand out — killer color options, elite-grade film, and pro-level installation.",
        "If you're ready to turn heads, melt timelines, and steal the whole show… your build starts here.",
        "Spots fill fast. Lock it in and let's wrap greatness.",
      ],
      closing: "Let's make your vehicle impossible to ignore.",
      buttonColor: "#00AFFF",
      accentColor: "#4EEAFF",
    },
  };

  const tonePreset = tonePresets[tone] || tonePresets.installer;
  const body = tonePreset.bodyParagraphs.join("<br><br>");
  const styles = getDesignStyles(design);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: ${styles.backgroundColor}; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: ${styles.containerColor}; 
          }
          .header { 
            background: ${styles.headerGradient}; 
            padding: 40px 20px; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
          }
          .content { 
            padding: 40px 20px; 
            color: ${styles.textColor}; 
          }
          .content h2 { 
            color: ${styles.headingColor}; 
            margin-top: 0; 
          }
          .content p { 
            line-height: 1.6; 
            color: ${styles.bodyColor}; 
          }
          .quote-details {
            background-color: ${styles.cardColor};
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid ${tonePreset.accentColor};
          }
          .quote-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid ${styles.borderColor};
          }
          .quote-row:last-child {
            border-bottom: none;
            font-weight: 600;
            font-size: 18px;
            padding-top: 12px;
          }
          .button { 
            display: inline-block; 
            padding: 12px 32px; 
            background: ${tonePreset.buttonColor}; 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600; 
          }
          .footer { 
            padding: 20px; 
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
            <h1>WrapCommand™</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.customer_name || "there"},</h2>
            <p>${body}</p>
            
            <div class="quote-details">
              <h3 style="margin-top: 0;">Quote Summary</h3>
              ${data.vehicle_make ? `<div class="quote-row"><span>Vehicle</span><span>${data.vehicle_year || ""} ${data.vehicle_make} ${data.vehicle_model || ""}</span></div>` : ""}
              ${data.product_name ? `<div class="quote-row"><span>Product</span><span>${data.product_name}</span></div>` : ""}
              ${data.sqft ? `<div class="quote-row"><span>Coverage</span><span>${data.sqft} sq ft</span></div>` : ""}
              ${data.material_cost ? `<div class="quote-row"><span>Material Cost</span><span>$${Number(data.material_cost).toFixed(2)}</span></div>` : ""}
              ${data.labor_cost ? `<div class="quote-row"><span>Labor Cost</span><span>$${Number(data.labor_cost).toFixed(2)}</span></div>` : ""}
              <div class="quote-row"><span>Total</span><span>$${Number(data.quote_total).toFixed(2)}</span></div>
            </div>
            
            ${data.portal_url ? `<a href="${data.portal_url}" class="button">View Full Quote</a>` : ""}
            
            <p style="margin-top: 30px;">${tonePreset.closing}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WrapCommand™. Powered by MightyMail™</p>
            ${data.footer_text ? `<p>${data.footer_text}</p>` : ""}
          </div>
        </div>
      </body>
    </html>
  `;
}

function getDesignStyles(design: string) {
  const themes: Record<string, any> = {
    clean: {
      backgroundColor: "#F9FAFB",
      containerColor: "#FFFFFF",
      headerGradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      textColor: "#111827",
      headingColor: "#111827",
      bodyColor: "#6B7280",
      cardColor: "#F9FAFB",
      borderColor: "#E5E7EB",
      footerColor: "#6B7280",
    },
    luxury: {
      backgroundColor: "#0A0A0F",
      containerColor: "#16161E",
      headerGradient: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
      textColor: "#E7E7EF",
      headingColor: "#FFFFFF",
      bodyColor: "#B8B8C7",
      cardColor: "#1A1A1F",
      borderColor: "rgba(255,255,255,0.06)",
      footerColor: "#6B7280",
    },
    performance: {
      backgroundColor: "#0A0A0F",
      containerColor: "#16161E",
      headerGradient: "linear-gradient(135deg, #00AFFF 0%, #008CFF 50%, #4EEAFF 100%)",
      textColor: "#E7E7EF",
      headingColor: "#FFFFFF",
      bodyColor: "#B8B8C7",
      cardColor: "#101016",
      borderColor: "rgba(255,255,255,0.06)",
      footerColor: "#6B7280",
    },
  };

  return themes[design] || themes.clean;
}

serve(handler);
