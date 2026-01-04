// January 2026 Campaign Configuration
// "New Year. New Systems. Better Wrap Jobs."
// LOCKED CAMPAIGN - DO NOT MODIFY DURING CAMPAIGN PERIOD

export const JANUARY_2026_CAMPAIGN = {
  id: "january_2026_new_year",
  name: "January 2026 — New Year. New Systems. Better Wrap Jobs.",
  dateRange: { 
    start: "2026-01-01", 
    end: "2026-01-31" 
  },
  
  // Target buyer persona
  targetBuyer: "Professional wrap shops handling commercial and fleet work.",
  
  // Global constraints (NON-NEGOTIABLE)
  globalConstraints: [
    "No autopilot claims",
    "No vibe-based content",
    "No music by default (music_style = none)",
    "No influencer language",
    "No hip hop / trend culture",
    "No rendering — output drafts only",
    "Everything must be professional, premium, and calm",
  ],
  
  // Core offers - ONLY these can be promoted
  coreOffers: [
    "CommercialPro quote system",
    "Bulk discounts",
    "Premium Wrap Guarantee",
    "1–2 day production",
    "RestylePro AI previews",
  ],
  
  // Allowed voice presets - NO substitutions
  allowedVoices: ["DARA_PREMIUM", "WPW_COMMERCIAL", "INK_EDGE_EDITORIAL"],
  
  // Default voice configuration
  defaultVoice: "DARA_PREMIUM × OGILVY",
  voiceTraits: [
    "Authority over urgency",
    "Identity mirroring",
    "Risk removal",
    "Systemized advantage",
  ],
  
  // Forbidden phrases - STRIPPED from output
  forbiddenPhrases: [
    "level up",
    "game changer",
    "don't miss out",
    "crushing it",
    "smash that",
    "link in bio",
    "drop a comment",
    "fire",
    "lit",
    "viral",
    "blow up",
    "grind",
    "hustle",
    "boss",
    "slay",
  ],
  
  // Overlay styles allowed
  overlayStyles: ["poppins_premium", "poppins_bold"],
  
  // Caption style locked
  captionStyle: "dara",
  
  // Music setting locked
  musicStyle: "none",
  
  // Content modes
  modes: {
    meta: {
      purpose: "conversion",
      tone: "calm, confident, professional",
      ctaAllowed: true,
    },
    organic: {
      purpose: "authority, education, recognition",
      softCtaOnly: true,
    },
  },
  
  // Output schemas by content type
  outputSchemas: {
    reel: {
      type: "object",
      required: ["type", "mode", "title", "overlays", "caption"],
      properties: {
        type: { const: "reel" },
        mode: { enum: ["meta", "organic"] },
        title: { type: "string" },
        intent_preset: { type: "string" },
        overlay_style: { enum: ["poppins_premium", "poppins_bold"] },
        caption_style: { const: "dara" },
        music_style: { const: "none" },
        overlays: {
          type: "array",
          items: {
            type: "object",
            required: ["text", "start", "end"],
            properties: {
              text: { type: "string", maxLength: 50 },
              start: { type: "number" },
              end: { type: "number" },
            },
          },
        },
        caption: { type: "string" },
        cta: { type: "string" },
      },
    },
    static: {
      type: "object",
      required: ["type", "headline", "caption"],
      properties: {
        type: { const: "static" },
        headline: { type: "string", maxLength: 60 },
        subtext: { type: "string" },
        caption: { type: "string" },
        cta: { type: "string" },
      },
    },
    carousel: {
      type: "object",
      required: ["type", "slides", "caption"],
      properties: {
        type: { const: "carousel" },
        slides: {
          type: "array",
          items: {
            type: "object",
            required: ["headline"],
            properties: {
              headline: { type: "string" },
              subtext: { type: "string" },
            },
          },
        },
        caption: { type: "string" },
      },
    },
  },
  
  // Quality check questions
  qualityChecks: [
    "Would a professional wrap shop owner respect this?",
    "Does it feel inevitable, not loud?",
    "Does it sell certainty, not excitement?",
  ],
} as const;

// System prompt builder - IMMUTABLE at runtime
export function buildCampaignSystemPrompt(contentType: string): string {
  const c = JANUARY_2026_CAMPAIGN;
  
  return `Role:
You are the Content Studio AI for WePrintWraps (WPW).
Your job is to create executable content drafts that obey system rules.
You do NOT invent strategy. You execute a locked campaign.

🔒 GLOBAL CONSTRAINTS (NON-NEGOTIABLE)
${c.globalConstraints.map(g => `• ${g}`).join('\n')}

If you cannot meet constraints → fail loud.

🎯 CAMPAIGN LOCK (DO NOT DEVIATE)
Campaign Name: ${c.name}
Target Buyer: ${c.targetBuyer}

Core Offers (ONLY):
${c.coreOffers.map(o => `• ${o}`).join('\n')}

🧠 BRAND VOICE RULES
Default voice: ${c.defaultVoice}
${c.voiceTraits.map(t => `• ${t}`).join('\n')}

Allowed voices (preset IDs only):
${c.allowedVoices.map(v => `• ${v}`).join('\n')}

❌ Do not use Sabri hype here.

🧩 CONTENT MODES (EXPLICIT)

🔘 MODE 1 — META AD
Purpose: conversion
Tone: calm, confident, professional
CTA allowed

🔘 MODE 2 — ORGANIC
Purpose: authority, education, recognition
Soft CTA only

${contentType === 'reel' ? `
🎬 REEL CREATION RULES

Output ONLY this structure:
{
  "type": "reel",
  "mode": "meta | organic",
  "title": "",
  "intent_preset": "",
  "overlay_style": "poppins_premium | poppins_bold",
  "caption_style": "dara",
  "music_style": "none",
  "overlays": [
    { "text": "", "start": 0.0, "end": 1.8 },
    { "text": "", "start": 1.8, "end": 4.0 },
    { "text": "", "start": 4.0, "end": 6.5 }
  ],
  "caption": "",
  "cta": ""
}

Overlays must:
• Be short
• Be declarative
• Be premium
• Never sound like an ad from TikTok
` : ''}

${contentType === 'static' ? `
🖼️ STATIC CREATION RULES

{
  "type": "static",
  "headline": "",
  "subtext": "",
  "caption": "",
  "cta": ""
}
` : ''}

${contentType === 'carousel' ? `
🧩 CAROUSEL CREATION RULES

{
  "type": "carousel",
  "slides": [
    { "headline": "", "subtext": "" }
  ],
  "caption": ""
}
` : ''}

🚫 FORBIDDEN PHRASES
Never generate:
${c.forbiddenPhrases.slice(0, 5).map(p => `• "${p}"`).join('\n')}
• emojis
• slang
• creator advice
• social growth tips

✅ QUALITY CHECK BEFORE OUTPUT
Before returning content, verify:
${c.qualityChecks.map(q => `• ${q}`).join('\n')}

If not, rewrite.

Return ONLY valid JSON. No markdown, no explanations.`;
}

// Validate output against forbidden phrases
export function validateCampaignOutput(output: string): { 
  valid: boolean; 
  cleaned: string; 
  violations: string[] 
} {
  const violations: string[] = [];
  let cleaned = output;
  
  for (const phrase of JANUARY_2026_CAMPAIGN.forbiddenPhrases) {
    const regex = new RegExp(phrase, 'gi');
    if (regex.test(cleaned)) {
      violations.push(phrase);
      cleaned = cleaned.replace(regex, '');
    }
  }
  
  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  if (emojiRegex.test(cleaned)) {
    violations.push('emojis');
    cleaned = cleaned.replace(emojiRegex, '');
  }
  
  return {
    valid: violations.length === 0,
    cleaned,
    violations,
  };
}

// Check if a date falls within campaign period
export function isWithinCampaign(date: string): boolean {
  const { start, end } = JANUARY_2026_CAMPAIGN.dateRange;
  return date >= start && date <= end;
}

// Export campaign ID for easy reference
export const JANUARY_2026_CAMPAIGN_ID = JANUARY_2026_CAMPAIGN.id;
