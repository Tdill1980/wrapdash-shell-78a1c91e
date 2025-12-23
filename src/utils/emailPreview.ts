// Client-side email preview generator - mirrors send-mightymail-quote templates

interface QuoteData {
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  product_name?: string;
  sqft?: number;
  material_cost?: number;
  labor_cost?: number;
  quote_total: number;
  portal_url?: string;
}

interface EmailPreviewData {
  customerName: string;
  quoteData: QuoteData;
  tone?: string;
  design?: string;
  offersInstallation?: boolean;
}

interface TonePreset {
  bodyParagraphs: string[];
  closing: string;
  buttonColor: string;
  accentColor: string;
}

// Print-only tones (WePrintWraps.com - no installation)
const printOnlyTonePresets: Record<string, TonePreset> = {
  installer: {
    bodyParagraphs: [
      "Your estimate is now ready with precise material and shipping details.",
      "All film selections are made using industry-standard materials and professional print specifications.",
      "This quote includes accurate SQFT calculations, panel layouts, and warranty-backed film options.",
      "If you have any questions regarding print quality, material specs, or shipping, we're here to help.",
    ],
    closing: "Thanks for trusting us with your vehicle wrap printing.",
    buttonColor: "#3B82F6",
    accentColor: "#60A5FA",
  },
  luxury: {
    bodyParagraphs: [
      "Your personalized wrap print proposal has been prepared with elevated attention to detail.",
      "We've curated this recommendation using top-tier films and premium printing specifications.",
      "Every element—finish, coverage, and precision—has been considered to deliver a refined, professional print.",
      "We look forward to printing a truly bespoke wrap for your vehicle.",
    ],
    closing: "Your vehicle deserves a flawless print — let's bring it to life.",
    buttonColor: "#D4AF37",
    accentColor: "#F59E0B",
  },
  hype: {
    bodyParagraphs: [
      "Your custom wrap print estimate is ready and it goes HARD.",
      "This setup was built to stand out — killer color options, elite-grade film, and precision printing.",
      "If you're ready to turn heads and steal the whole show… your print starts here.",
      "Spots fill fast. Lock it in and let's print greatness.",
    ],
    closing: "Let's make your vehicle impossible to ignore.",
    buttonColor: "#00AFFF",
    accentColor: "#4EEAFF",
  },
};

// Installer tones (subdomain shops that offer installation)
const installerTonePresets: Record<string, TonePreset> = {
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

// Helper to get the right tones
export function getTonePresets(offersInstallation: boolean): Record<string, TonePreset> {
  return offersInstallation ? installerTonePresets : printOnlyTonePresets;
}

const designStyles: Record<string, {
  backgroundColor: string;
  containerColor: string;
  headerGradient: string;
  textColor: string;
  headingColor: string;
  bodyColor: string;
  cardColor: string;
  borderColor: string;
  footerColor: string;
}> = {
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

export function getSubjectLine(tone: string, quoteData: QuoteData): string {
  const templates: Record<string, string> = {
    installer: `Your Vehicle Wrap Quote for ${quoteData.vehicle_make || "Your Vehicle"} ${quoteData.vehicle_model || ""}`.trim(),
    luxury: "Your Premium Wrap Experience Awaits",
    hype: "🔥 Your Wrap Quote is Ready — Let's Transform This Ride!",
  };
  
  return templates[tone] || templates.installer;
}

export function generateEmailPreview({
  customerName,
  quoteData,
  tone = "installer",
  design = "performance",
  offersInstallation = false, // WPW is print-only by default
}: EmailPreviewData): string {
  const tonePresets = getTonePresets(offersInstallation);
  const tonePreset = tonePresets[tone] || tonePresets.installer;
  const styles = designStyles[design] || designStyles.performance;
  const body = tonePreset.bodyParagraphs.join("<br><br>");

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
            <h1>WePrintWraps</h1>
          </div>
          <div class="content">
            <h2>Hi ${customerName || "there"},</h2>
            <p>${body}</p>
            
            <div class="quote-details">
              <h3 style="margin-top: 0; color: ${styles.headingColor};">Quote Summary</h3>
              ${quoteData.vehicle_make ? `<div class="quote-row"><span>Vehicle</span><span>${quoteData.vehicle_year || ""} ${quoteData.vehicle_make} ${quoteData.vehicle_model || ""}</span></div>` : ""}
              ${quoteData.product_name ? `<div class="quote-row"><span>Product</span><span>${quoteData.product_name}</span></div>` : ""}
              ${quoteData.sqft ? `<div class="quote-row"><span>Coverage</span><span>${quoteData.sqft} sq ft</span></div>` : ""}
              ${quoteData.material_cost ? `<div class="quote-row"><span>Material Cost</span><span>$${Number(quoteData.material_cost).toFixed(2)}</span></div>` : ""}
              ${quoteData.labor_cost ? `<div class="quote-row"><span>Labor Cost</span><span>$${Number(quoteData.labor_cost).toFixed(2)}</span></div>` : ""}
              <div class="quote-row"><span>Total</span><span>$${Number(quoteData.quote_total).toFixed(2)}</span></div>
            </div>
            
            ${quoteData.portal_url ? `<a href="${quoteData.portal_url}" class="button">View Full Quote</a>` : ""}
            
            <p style="margin-top: 30px;">${tonePreset.closing}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WePrintWraps.com - Premium Vehicle Wrap Printing</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export const EMAIL_TONES = [
  { value: 'installer', label: 'Installer (Professional)' },
  { value: 'luxury', label: 'Luxury (Premium)' },
  { value: 'hype', label: 'Hype (Energetic)' },
];

export const EMAIL_DESIGNS = [
  { value: 'performance', label: 'Performance (Dark)' },
  { value: 'luxury', label: 'Luxury (Dark Gold)' },
  { value: 'clean', label: 'Clean (Light)' },
];
