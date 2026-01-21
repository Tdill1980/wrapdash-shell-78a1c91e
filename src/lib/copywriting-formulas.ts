/**
 * Copywriting Formula Library
 * Proven frameworks from Ogilvy, Sabri Suby, Dara Denney, Gary Vee
 */

export type CopyFormula = "ogilvy" | "sabri" | "dara" | "garyvee" | "aida" | "pas";

export interface CopyFormulaConfig {
  id: CopyFormula;
  name: string;
  emoji: string;
  description: string;
  psychology: string;
  structure: {
    headline: string;
    body: string;
    cta: string;
  };
  rules: string[];
  triggerWords: string[];
  examples: string[];
  bestFor: string[];
}

export const COPY_FORMULAS: Record<CopyFormula, CopyFormulaConfig> = {
  ogilvy: {
    id: "ogilvy",
    name: "Ogilvy",
    emoji: "📰",
    description: "Authority-first, editorial, factual credibility",
    psychology: "Position as the obvious, trusted choice. Facts over feelings. Never shout, let the product speak.",
    structure: {
      headline: "Factual claim with specificity and credibility",
      body: "Evidence-based proof points, testimonials from authority",
      cta: "Confident invitation, not urgent demand"
    },
    rules: [
      "Lead with authority, not excitement",
      "Use specific numbers and facts",
      "NEVER use exclamation marks",
      "Position as the obvious choice",
      "Headlines should average 6-12 words",
      "Long copy sells when interesting",
      "Every word must earn its place"
    ],
    triggerWords: [
      "The #1", "Proven by", "Trusted by", "Since [year]",
      "Industry-leading", "Certified", "Recommended by",
      "The choice of", "Preferred by", "Award-winning"
    ],
    examples: [
      "At 60 miles an hour, the loudest noise comes from the electric clock.",
      "The man in the Hathaway shirt.",
      "Only Dove is one-quarter moisturizing cream."
    ],
    bestFor: ["premium brands", "trust-building", "B2B", "luxury", "service businesses"]
  },

  sabri: {
    id: "sabri",
    name: "Sabri Suby",
    emoji: "🔥",
    description: "Pain-Agitate-Solution, direct response mastery",
    psychology: "Enter the conversation in your prospect's head. Name their pain, twist the knife, then present the obvious solution.",
    structure: {
      headline: "Name the EXACT pain they're feeling right now",
      body: "Agitate: Make it urgent. Then present your solution with irresistible proof.",
      cta: "Clear, specific next step with urgency"
    },
    rules: [
      "Start with pain, NEVER with product",
      "Agitate before solving",
      "One clear CTA only",
      "Proof > Promise",
      "Specificity sells (exact numbers, timeframes)",
      "Remove all friction from the next step",
      "Stack guarantees to eliminate risk"
    ],
    triggerWords: [
      "Tired of", "Struggling with", "Frustrated by",
      "Stop wasting", "Finally", "Discover how",
      "Warning:", "The truth about", "Secret",
      "Revealed", "Guaranteed", "Risk-free"
    ],
    examples: [
      "Tired of wrap shops ghosting you after the quote?",
      "Warning: Your fleet is losing $47/day in missed impressions.",
      "Finally: A wrap that actually looks like the mockup."
    ],
    bestFor: ["lead generation", "sales pages", "urgent offers", "problem-aware audiences"]
  },

  dara: {
    id: "dara",
    name: "Dara Denney",
    emoji: "✨",
    description: "Premium, identity-mirroring, calm confidence",
    psychology: "Mirror the buyer's best self-image. Authority over urgency. Make it feel inevitable, not desperate.",
    structure: {
      headline: "Identity statement that mirrors who they want to be",
      body: "Aspirational but grounded. You understand them.",
      cta: "Soft, inevitable invitation"
    },
    rules: [
      "Mirror the buyer's self-image",
      "Authority over urgency ALWAYS",
      "Make it feel inevitable, not desperate",
      "Premium tone, never salesy",
      "Speak to identity, not just needs",
      "Exclusivity > availability",
      "Confidence without arrogance"
    ],
    triggerWords: [
      "You're the kind of", "For those who",
      "Designed for", "When you're ready",
      "The difference between", "You already know",
      "That feeling when", "Made for"
    ],
    examples: [
      "For wrap shops who refuse to be invisible.",
      "You already know your work is worth more.",
      "The shops that get this, get everything."
    ],
    bestFor: ["premium positioning", "brand building", "Instagram", "aspirational buyers"]
  },

  garyvee: {
    id: "garyvee",
    name: "Gary Vee",
    emoji: "💪",
    description: "Direct, punchy, zero-BS energy",
    psychology: "Cut through the noise with brutal honesty. No fluff, no filler. Speak like you're talking to a friend who needs to hear the truth.",
    structure: {
      headline: "Blunt truth nobody else will say",
      body: "Short, declarative sentences. Pure value.",
      cta: "Action-oriented, no overthinking"
    },
    rules: [
      "No fluff, no filler, no BS",
      "Speak like you're talking to a friend",
      "Make the obvious point nobody says",
      "Energy but not hype",
      "Document, don't create",
      "Value first, always",
      "Keep it real or keep it moving"
    ],
    triggerWords: [
      "Look,", "Here's the thing:", "Stop overthinking.",
      "Just do it.", "Real talk:", "The truth is",
      "Wake up.", "Let's go.", "No excuses."
    ],
    examples: [
      "Look, your competitors are outworking you. Period.",
      "Stop waiting for the perfect moment. It doesn't exist.",
      "The best time to wrap was yesterday. The second best is now."
    ],
    bestFor: ["motivation", "entrepreneurial audiences", "social media", "personal brands"]
  },

  aida: {
    id: "aida",
    name: "AIDA",
    emoji: "📈",
    description: "Attention-Interest-Desire-Action classic funnel",
    psychology: "The grandfather of sales copy. Grab attention, build interest, create desire, demand action.",
    structure: {
      headline: "Pattern interrupt that grabs ATTENTION",
      body: "Build INTEREST with benefits, create DESIRE with proof",
      cta: "Clear ACTION with urgency"
    },
    rules: [
      "Attention must be earned in 2 seconds",
      "Interest comes from relevance to THEM",
      "Desire requires visualization",
      "Action must be crystal clear",
      "Each element flows to the next",
      "Remove all objections before CTA"
    ],
    triggerWords: [
      "Imagine", "Picture this", "What if",
      "Now", "Today only", "Limited",
      "Don't miss", "Act now", "Get started"
    ],
    examples: [
      "STOP. Your fleet just drove past 47,000 eyeballs today.",
      "Imagine every red light becoming a sales pitch. That's fleet wraps.",
      "What if your vehicle was selling 24/7?"
    ],
    bestFor: ["landing pages", "email sequences", "traditional advertising"]
  },

  pas: {
    id: "pas",
    name: "PAS",
    emoji: "🎯",
    description: "Problem-Agitate-Solve essentials",
    psychology: "Simple but devastating. Name the problem, make it hurt, solve it.",
    structure: {
      headline: "State the PROBLEM clearly",
      body: "AGITATE: Why it's costing them. SOLVE: Your answer.",
      cta: "The obvious next step"
    },
    rules: [
      "Problem must be specific and real",
      "Agitate without being manipulative",
      "Solution must feel inevitable",
      "Keep it focused on ONE problem",
      "Proof makes the solution credible"
    ],
    triggerWords: [
      "Problem:", "The cost of", "Every day you wait",
      "Here's what's happening:", "The solution:",
      "But there's a fix", "Here's how"
    ],
    examples: [
      "Problem: Your vans are advertising NOTHING right now.",
      "Every month without wraps = $4,200 in missed impressions. The fix? One call.",
      "Faded wraps scream 'we don't care.' Fresh wraps say 'we're the best.'"
    ],
    bestFor: ["quick wins", "problem-aware audiences", "B2B", "service businesses"]
  }
};

export const FORMULA_OPTIONS = Object.values(COPY_FORMULAS).map(f => ({
  id: f.id,
  name: f.name,
  emoji: f.emoji,
  description: f.description
}));

/**
 * Get formula-specific prompt for AI copy enhancement
 */
export function getFormulaPrompt(formula: CopyFormula): string {
  const config = COPY_FORMULAS[formula];
  
  return `
═══════════════════════════════════════════════════════════════
🎯 COPYWRITING FRAMEWORK: ${config.emoji} ${config.name.toUpperCase()}
═══════════════════════════════════════════════════════════════

PSYCHOLOGY: ${config.psychology}

STRUCTURE:
- Headline: ${config.structure.headline}
- Body: ${config.structure.body}
- CTA: ${config.structure.cta}

RULES (FOLLOW EXACTLY):
${config.rules.map(r => `  • ${r}`).join("\n")}

TRIGGER WORDS TO USE:
${config.triggerWords.slice(0, 6).join(", ")}

EXAMPLE COPY:
${config.examples.map(e => `  "${e}"`).join("\n")}

BEST FOR: ${config.bestFor.join(", ")}

CRITICAL: Transform the raw copy using THIS framework's voice and structure.
`;
}

/**
 * Build the complete system prompt for copy enhancement
 */
export function buildCopyBoostSystemPrompt(
  formula: CopyFormula,
  buyerPersona: "wrap_shop" | "fleet_manager" | "consumer" | "general"
): string {
  const formulaPrompt = getFormulaPrompt(formula);
  
  const personaContext = {
    wrap_shop: "The buyer is a WRAP SHOP OWNER - busy entrepreneur, values efficiency, professional quality, and making money.",
    fleet_manager: "The buyer is a FLEET MANAGER - focused on ROI, brand visibility, vehicle protection, and professionalism.",
    consumer: "The buyer is a CONSUMER - wants their personal vehicle to look amazing, express personality, and stand out.",
    general: "The buyer could be any business owner looking for vehicle branding solutions."
  };

  return `You are an elite direct-response copywriter trained by the masters: David Ogilvy, Sabri Suby, Dara Denney, and Gary Vaynerchuk.

${formulaPrompt}

TARGET BUYER:
${personaContext[buyerPersona]}

YOUR MISSION:
Transform the raw input copy into HIGH-CONVERTING Meta ad copy that:
1. Stops the scroll in 2 seconds
2. Creates emotional resonance
3. Drives immediate action
4. Feels authentic, not salesy

OUTPUT FORMAT (JSON):
{
  "headline": "The enhanced headline (max 40 chars)",
  "primary_text": "The enhanced body copy (max 125 chars for ads)",
  "cta": "The call to action (2-4 words)"
}

CRITICAL RULES:
- NO generic marketing fluff
- NO emojis unless absolutely necessary
- NO hype words (amazing, incredible, revolutionary)
- MUST match the formula's voice and energy
- MUST be specific to the product/service
- MUST create urgency without being pushy
`;
}
