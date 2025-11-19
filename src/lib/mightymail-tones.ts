export interface EmailTone {
  id: string;
  label: string;
  description: string;
  subjectTemplate: string;
  bodyParagraphs: string[];
  closing: string;
  style: {
    headerColor: string;
    buttonColor: string;
    accentColor: string;
  };
}

export const emailTones: Record<string, EmailTone> = {
  installer: {
    id: "installer",
    label: "Pro Installer Tone",
    description: "Direct, technical, and professional. Perfect for installers, fleets, and commercial customers.",
    subjectTemplate: "Your Vehicle Wrap Quote for {{vehicle_make}} {{vehicle_model}}",
    bodyParagraphs: [
      "Your estimate is now ready with precise material and installation details.",
      "All film selections are made using industry-standard materials and professional specifications.",
      "This quote includes accurate SQFT calculations, install hour estimates, and warranty-backed film options.",
      "If you have any questions regarding fitment, panel layout, or film performance, we're here to help.",
    ],
    closing: "Thanks for trusting us with your vehicle wrap project.",
    style: {
      headerColor: "#1F2937",
      buttonColor: "#3B82F6",
      accentColor: "#60A5FA",
    },
  },
  luxury: {
    id: "luxury",
    label: "Luxury Auto Spa Tone",
    description: "Smooth, elevated, and refined. Perfect for high-end vehicles, exotic clients, and PPF customers.",
    subjectTemplate: "Your Premium Wrap Experience Awaits",
    bodyParagraphs: [
      "Your personalized wrap proposal has been prepared with elevated attention to detail.",
      "We've curated this recommendation using top-tier films and premium installation techniques.",
      "Every element—finish, coverage, and craftsmanship—has been considered to deliver a refined, elevated transformation.",
      "We look forward to creating a truly bespoke wrap experience for your vehicle.",
    ],
    closing: "Your vehicle deserves a flawless finish — let's bring it to life.",
    style: {
      headerColor: "#0A0A0F",
      buttonColor: "#D4AF37",
      accentColor: "#F59E0B",
    },
  },
  hype: {
    id: "hype",
    label: "Hype Restyler Tone",
    description: "Aggressive, energetic, high-conviction. Perfect for drift builds, show cars, and restyle customers.",
    subjectTemplate: "🔥 Your Wrap Quote is Ready — Let's Transform This Ride!",
    bodyParagraphs: [
      "Your custom wrap estimate is ready and it goes HARD.",
      "This setup was built to stand out — killer color options, elite-grade film, and pro-level installation.",
      "If you're ready to turn heads, melt timelines, and steal the whole show… your build starts here.",
      "Spots fill fast. Lock it in and let's wrap greatness.",
    ],
    closing: "Let's make your vehicle impossible to ignore.",
    style: {
      headerColor: "#0A0A0F",
      buttonColor: "#00AFFF",
      accentColor: "#4EEAFF",
    },
  },
};

export function renderEmailTemplate(
  tone: string,
  design: string,
  data: Record<string, any>
): string {
  const tonePreset = emailTones[tone] || emailTones.installer;
  
  // Replace template variables
  let subject = tonePreset.subjectTemplate;
  let body = tonePreset.bodyParagraphs.join("<br><br>");
  
  Object.keys(data).forEach((key) => {
    const value = data[key];
    subject = subject.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    body = body.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  });

  // Build HTML based on design theme
  const html = buildEmailHTML(design, tonePreset, subject, body, data);
  
  return html;
}

function buildEmailHTML(
  design: string,
  tone: EmailTone,
  subject: string,
  body: string,
  data: Record<string, any>
): string {
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
            border-left: 4px solid ${tone.style.accentColor};
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
            background: ${tone.style.buttonColor}; 
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
            ${data.logo_url ? `<img src="${data.logo_url}" alt="Company Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 10px;" />` : `<h1>WrapCommand™</h1>`}
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${body}</p>
            
            ${data.quote_total ? `
            <div class="quote-details">
              <h3 style="margin-top: 0;">Quote Summary</h3>
              ${data.vehicle_make ? `<div class="quote-row"><span>Vehicle</span><span>${data.vehicle_year || ''} ${data.vehicle_make} ${data.vehicle_model || ''}</span></div>` : ''}
              ${data.product_name ? `<div class="quote-row"><span>Product</span><span>${data.product_name}</span></div>` : ''}
              ${data.sqft ? `<div class="quote-row"><span>Coverage</span><span>${data.sqft} sq ft</span></div>` : ''}
              ${data.material_cost ? `<div class="quote-row"><span>Material Cost</span><span>$${data.material_cost}</span></div>` : ''}
              ${data.labor_cost ? `<div class="quote-row"><span>Labor Cost</span><span>$${data.labor_cost}</span></div>` : ''}
              <div class="quote-row"><span>Total</span><span>$${data.quote_total}</span></div>
            </div>
            ` : ''}
            
            <a href="${data.portal_url || '#'}" class="button">View Full Quote</a>
            
            <p style="margin-top: 30px;">${tone.closing}</p>
          </div>
          <div class="footer">
            ${data.logo_url ? `<img src="${data.logo_url}" alt="Company Logo" style="max-width: 150px; max-height: 60px; margin-bottom: 10px; opacity: 0.8;" />` : ''}
            <p>© ${new Date().getFullYear()} WrapCommand™. Powered by <span style="color: white;">Mighty</span><span style="background: linear-gradient(90deg, #00AFFF, #4EEAFF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Mail™</span></p>
            <p>${data.footer_text || 'Professional vehicle wrap solutions.'}</p>
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
