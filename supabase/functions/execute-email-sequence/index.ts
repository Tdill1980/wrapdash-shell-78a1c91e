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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SequenceEmail {
  delay_hours: number;
  subject: string;
  body?: string;
  preview_text?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting email sequence execution...");

  try {
    // Get all active enrollments that need emails sent
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("email_sequence_enrollments")
      .select(`
        *,
        sequence:email_sequences(*),
        quote:quotes(*)
      `)
      .eq("is_active", true)
      .is("completed_at", null)
      .is("unsubscribed_at", null);

    if (enrollmentError) {
      console.error("Error fetching enrollments:", enrollmentError);
      throw enrollmentError;
    }

    console.log(`Found ${enrollments?.length || 0} active enrollments`);

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const enrollment of enrollments || []) {
      try {
        // Check if customer has unsubscribed
        const { data: unsubscribe } = await supabase
          .from("email_unsubscribes")
          .select("id")
          .eq("email", enrollment.customer_email)
          .single();

        if (unsubscribe) {
          console.log(`Skipping ${enrollment.customer_email} - unsubscribed`);
          await supabase
            .from("email_sequence_enrollments")
            .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
            .eq("id", enrollment.id);
          results.skipped++;
          continue;
        }

        // Check if email has bounced
        const { data: bounce } = await supabase
          .from("email_bounces")
          .select("id")
          .eq("email", enrollment.customer_email)
          .eq("bounce_type", "hard")
          .single();

        if (bounce) {
          console.log(`Skipping ${enrollment.customer_email} - hard bounce`);
          await supabase
            .from("email_sequence_enrollments")
            .update({ is_active: false })
            .eq("id", enrollment.id);
          results.skipped++;
          continue;
        }

        const sequence = enrollment.sequence;
        const emails: SequenceEmail[] = sequence?.emails || [];
        const emailsSent = enrollment.emails_sent || 0;

        if (emailsSent >= emails.length) {
          // Sequence completed
          await supabase
            .from("email_sequence_enrollments")
            .update({ 
              is_active: false, 
              completed_at: new Date().toISOString() 
            })
            .eq("id", enrollment.id);
          console.log(`Sequence completed for ${enrollment.customer_email}`);
          continue;
        }

        const nextEmail = emails[emailsSent];
        if (!nextEmail) {
          results.skipped++;
          continue;
        }

        // Calculate if it's time to send the next email
        const enrolledAt = new Date(enrollment.enrolled_at);
        const lastSentAt = enrollment.last_email_sent_at 
          ? new Date(enrollment.last_email_sent_at) 
          : enrolledAt;
        const hoursSinceEnrollment = (Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60);
        const hoursSinceLastEmail = (Date.now() - lastSentAt.getTime()) / (1000 * 60 * 60);

        // Check if we've waited long enough for this email
        if (hoursSinceEnrollment < nextEmail.delay_hours) {
          console.log(`Not time yet for email ${emailsSent + 1} to ${enrollment.customer_email}`);
          results.skipped++;
          continue;
        }

        // Get branding
        const { data: branding } = await supabase
          .from("email_branding")
          .select("*")
          .single();

        // Build email HTML with unsubscribe link
        const unsubscribeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-email-unsubscribe?email=${encodeURIComponent(enrollment.customer_email)}`;
        
        const quote = enrollment.quote;
        const emailHTML = buildSequenceEmail({
          customerName: enrollment.customer_name || "there",
          subject: nextEmail.subject,
          body: nextEmail.body || getDefaultBody(sequence.writing_tone, emailsSent),
          tone: sequence.writing_tone || "installer",
          design: sequence.design_style || "performance",
          quoteData: quote,
          unsubscribeUrl,
          branding,
        });

        // Generate tracking UTIM
        const emailId = crypto.randomUUID();
        const utim = quote?.id 
          ? btoa(`${enrollment.id}:${quote.id}:sequence_${emailsSent}:${emailId}:${Date.now()}`)
          : '';

        // Inject tracking pixel if we have UTIM
        let finalHTML = emailHTML;
        if (utim) {
          const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '') || '';
          const trackingPixel = `<img src="${baseUrl}/functions/v1/track-email-open?utim=${utim}" width="1" height="1" style="display:none;" alt="" />`;
          finalHTML = emailHTML.replace('</body>', `${trackingPixel}</body>`);
        }

        // Send email
        const fromEmail = branding?.sender_email || "onboarding@resend.dev";
        const fromName = branding?.sender_name || "WrapCommand";

        const emailResponse = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [enrollment.customer_email],
          subject: nextEmail.subject,
          html: finalHTML,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        console.log(`Sent sequence email ${emailsSent + 1} to ${enrollment.customer_email}:`, emailResponse);

        // Update enrollment
        await supabase
          .from("email_sequence_enrollments")
          .update({
            emails_sent: emailsSent + 1,
            last_email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);

        // Log to email_tracking
        await supabase.from("email_tracking").insert({
          customer_id: null,
          sequence_id: sequence.id,
          email_subject: nextEmail.subject,
          status: "sent",
          metadata: {
            enrollment_id: enrollment.id,
            email_index: emailsSent,
            quote_id: quote?.id,
          },
        });

        results.sent++;
        results.processed++;
      } catch (emailError: any) {
        console.error(`Error processing enrollment ${enrollment.id}:`, emailError);
        results.errors.push(`${enrollment.id}: ${emailError.message}`);
      }
    }

    console.log("Sequence execution complete:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in execute-email-sequence:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

function getDefaultBody(tone: string, emailIndex: number): string {
  const bodies: Record<string, string[]> = {
    installer: [
      "Your vehicle wrap quote is ready. We've prepared detailed specifications including material selection and installation timeline.",
      "Just checking in on your wrap quote. Our team is ready to answer any questions about the installation process or materials.",
      "This is a friendly reminder that your quote will expire soon. Lock in your pricing today before materials or labor rates change.",
      "Final notice: Your wrap quote expires tomorrow. Don't miss out on transforming your vehicle.",
    ],
    luxury: [
      "Your personalized wrap consultation is complete. We've curated a premium selection tailored to your vehicle.",
      "Following up on your bespoke wrap proposal. Our concierge team is available to discuss any refinements.",
      "Your exclusive quote pricing is expiring soon. Secure your premium transformation today.",
      "Last opportunity to proceed with your luxury wrap at the quoted rate.",
    ],
    hype: [
      "Your wrap quote is READY and it goes HARD! 🔥 Let's make your ride impossible to ignore.",
      "Still thinking about that wrap? Your build is waiting to go viral! 🚗💨",
      "⚡ Quote expires soon! Lock it in before someone else steals your style.",
      "🚨 FINAL CALL! Your wrap quote dies tomorrow. Don't let this slip!",
    ],
  };

  const toneBody = bodies[tone] || bodies.installer;
  return toneBody[Math.min(emailIndex, toneBody.length - 1)];
}

function buildSequenceEmail(params: {
  customerName: string;
  subject: string;
  body: string;
  tone: string;
  design: string;
  quoteData: any;
  unsubscribeUrl: string;
  branding: any;
}): string {
  const { customerName, body, tone, design, quoteData, unsubscribeUrl, branding } = params;

  const toneColors: Record<string, { button: string; accent: string }> = {
    installer: { button: "#3B82F6", accent: "#60A5FA" },
    luxury: { button: "#D4AF37", accent: "#F59E0B" },
    hype: { button: "#00AFFF", accent: "#4EEAFF" },
  };

  const colors = toneColors[tone] || toneColors.installer;

  const designStyles: Record<string, any> = {
    clean: {
      bg: "#F9FAFB", container: "#FFFFFF", header: "linear-gradient(135deg, #10B981, #059669)",
      text: "#111827", heading: "#111827", bodyColor: "#6B7280", card: "#F9FAFB", border: "#E5E7EB",
    },
    luxury: {
      bg: "#0A0A0F", container: "#16161E", header: "linear-gradient(135deg, #D4AF37, #B8860B)",
      text: "#E7E7EF", heading: "#FFFFFF", bodyColor: "#B8B8C7", card: "#1A1A1F", border: "rgba(255,255,255,0.06)",
    },
    performance: {
      bg: "#0A0A0F", container: "#16161E", header: "linear-gradient(135deg, #00AFFF, #008CFF, #4EEAFF)",
      text: "#E7E7EF", heading: "#FFFFFF", bodyColor: "#B8B8C7", card: "#101016", border: "rgba(255,255,255,0.06)",
    },
  };

  const styles = designStyles[design] || designStyles.performance;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:${styles.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background-color:${styles.container};">
          <div style="background:${styles.header};padding:40px 20px;text-align:center;">
            ${branding?.logo_url ? `<img src="${branding.logo_url}" alt="Logo" style="max-height:50px;margin-bottom:10px;">` : ''}
            <h1 style="color:white;margin:0;font-size:28px;">WrapCommand™</h1>
          </div>
          <div style="padding:40px 20px;color:${styles.text};">
            <h2 style="color:${styles.heading};margin-top:0;">Hi ${customerName},</h2>
            <p style="line-height:1.6;color:${styles.bodyColor};">${body}</p>
            
            ${quoteData ? `
              <div style="background-color:${styles.card};padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid ${colors.accent};">
                <h3 style="margin-top:0;color:${styles.heading};">Quote Summary</h3>
                ${quoteData.vehicle_make ? `<p style="margin:8px 0;color:${styles.bodyColor};">Vehicle: ${quoteData.vehicle_year || ''} ${quoteData.vehicle_make} ${quoteData.vehicle_model || ''}</p>` : ''}
                ${quoteData.product_name ? `<p style="margin:8px 0;color:${styles.bodyColor};">Product: ${quoteData.product_name}</p>` : ''}
                <p style="margin:8px 0;font-weight:600;font-size:18px;color:${styles.heading};">Total: $${Number(quoteData.total_price || quoteData.customer_price || 0).toFixed(2)}</p>
              </div>
            ` : ''}
            
            <a href="${quoteData?.portal_url || '#'}" style="display:inline-block;padding:12px 32px;background:${colors.button};color:white;text-decoration:none;border-radius:8px;margin:20px 0;font-weight:600;">
              View Quote
            </a>
          </div>
          <div style="padding:20px;text-align:center;color:#6B7280;font-size:12px;border-top:1px solid ${styles.border};">
            <p>© ${new Date().getFullYear()} WrapCommand™. Powered by MightyMail™</p>
            ${branding?.footer_text ? `<p>${branding.footer_text}</p>` : ''}
            <p style="margin-top:15px;">
              <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">Unsubscribe</a> from these emails
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}