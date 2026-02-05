// =============================================================
// VOICECOMMANDAI SYSTEM
// Unified AI Parsing, Tagging & Auto-Quote Engine
// =============================================================
//
// VoiceCommandAI powers intelligent processing across ALL channels:
// - Website Chat (Jordan Lee)
// - Phone Calls (VAPI voice agent)
// - Instagram DMs (Casey Ramirez)
// - Email (Alex Morgan)
// - Auto-Quote Generation
//
// Core Capabilities:
// 1. Intent Classification - quote, support, design, general
// 2. Vehicle Extraction - year, make, model parsing
// 3. Pricing Detection - identifies pricing/quote interest
// 4. Hot Lead Detection - flags high-value opportunities
// 5. Contact Tagging - automatic lead scoring
// 6. Auto-Quote Generation - instant pricing with vehicle lookup
// =============================================================

export const VOICECOMMAND_AI = {
  name: "VoiceCommandAI",
  version: "1.0.0",

  // AI Agents by channel
  agents: {
    website_chat: "Jordan Lee",
    phone: "Taylor (VAPI)",
    instagram: "Casey Ramirez",
    email: "Alex Morgan",
  },

  // Intent types the system can classify
  intents: [
    "quote_request",
    "design_inquiry",
    "order_status",
    "upset_customer",
    "file_received",
    "general_inquiry",
  ] as const,

  // Hot lead indicators
  hotLeadKeywords: [
    "fleet",
    "multiple vehicles",
    "commercial",
    "wrap shop",
    "ready to order",
    "need asap",
    "urgent",
    "bulk",
    "business",
  ],

  // Pricing detection keywords
  pricingKeywords: [
    "price",
    "pricing",
    "cost",
    "how much",
    "quote",
    "estimate",
    "$",
    "dollar",
    "ballpark",
    "budget",
    "rate",
  ],
};

export type VoiceCommandIntent = typeof VOICECOMMAND_AI.intents[number];

export interface VoiceCommandClassification {
  system: "VoiceCommandAI";
  version: string;
  intent: VoiceCommandIntent;
  confidence: number;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
  wants_pricing: boolean;
  is_hot_lead: boolean;
  urgency: "low" | "normal" | "high";
  tags: string[];
  extracted_email?: string;
  processed_at: string;
}

/**
 * Check if message contains hot lead indicators
 */
export function detectHotLead(text: string): boolean {
  const lower = text.toLowerCase();
  return VOICECOMMAND_AI.hotLeadKeywords.some(kw => lower.includes(kw));
}

/**
 * Check if message contains pricing intent
 */
export function detectPricingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return VOICECOMMAND_AI.pricingKeywords.some(kw => lower.includes(kw));
}

/**
 * Create a VoiceCommandAI classification result
 */
export function createClassification(
  intent: VoiceCommandIntent,
  options: Partial<Omit<VoiceCommandClassification, 'system' | 'version' | 'intent' | 'processed_at'>>
): VoiceCommandClassification {
  return {
    system: "VoiceCommandAI",
    version: VOICECOMMAND_AI.version,
    intent,
    confidence: options.confidence ?? 0.9,
    vehicle: options.vehicle,
    wants_pricing: options.wants_pricing ?? false,
    is_hot_lead: options.is_hot_lead ?? false,
    urgency: options.urgency ?? "normal",
    tags: options.tags ?? [],
    extracted_email: options.extracted_email,
    processed_at: new Date().toISOString(),
  };
}

/**
 * Get the AI agent name for a channel
 */
export function getAgentForChannel(channel: string): string {
  const agents: Record<string, string> = VOICECOMMAND_AI.agents;
  return agents[channel] || "VoiceCommandAI";
}

console.log(`🤖 ${VOICECOMMAND_AI.name} v${VOICECOMMAND_AI.version} loaded`);
