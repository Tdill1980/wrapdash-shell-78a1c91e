/**
 * Build Final Prompt - THE CRITICAL MERGER
 * 
 * This function merges content intent + persuasion framework + format constraints
 * into a single prompt that NEVER allows format to override content.
 * 
 * Format = HOW it looks (layout, pacing, visual style)
 * Content = WHAT we're saying (message, offer, CTA)
 * Persuasion = WHY it converts (pain, agitate, solve)
 */

export interface PromptComponents {
  /** The core message/objective - NEVER gets overwritten */
  contentIntent: string;
  
  /** The persuasion structure (Sabri/Dara/Clean framework) */
  persuasionFramework?: string;
  
  /** The format/layout instructions (Grid Style, UGC, etc.) */
  formatPrompt?: string;
  
  /** Additional context that doesn't override intent */
  additionalContext?: string;
}

/**
 * Build a merged prompt that protects content intent
 * 
 * The AI will receive clear instructions that:
 * 1. Content objective is sacred and cannot be changed
 * 2. Persuasion logic guides the copy structure
 * 3. Format only controls visual presentation
 */
export function buildFinalPrompt(params: PromptComponents): string {
  const sections: string[] = [];

  // CONTENT OBJECTIVE - Always first, marked as sacred
  sections.push(`CONTENT OBJECTIVE (DO NOT CHANGE):
${params.contentIntent}`);

  // PERSUASION LOGIC - If provided
  if (params.persuasionFramework) {
    sections.push(`PERSUASION LOGIC (USE THIS STRUCTURE):
${params.persuasionFramework}`);
  }

  // FORMAT INSTRUCTIONS - Clearly marked as style-only
  if (params.formatPrompt) {
    sections.push(`FORMAT INSTRUCTIONS (STYLE ONLY):
${params.formatPrompt}`);
  }

  // ADDITIONAL CONTEXT - If provided
  if (params.additionalContext) {
    sections.push(`ADDITIONAL CONTEXT:
${params.additionalContext}`);
  }

  // CRITICAL RULES - Always enforced
  sections.push(`IMPORTANT RULES:
- Do NOT invent a new message or objective.
- Do NOT replace or ignore the content objective above.
- Do NOT remove pricing, offers, or CTAs from the objective.
- Format controls ONLY layout, pacing, and visual style.
- The content objective is the source of truth.`);

  return sections.join("\n\n");
}

/**
 * Build a Sabri-style persuasion framework
 */
export function buildSabriFramework(params: {
  pain: string;
  agitate: string;
  solution: string;
  proof?: string;
  urgency?: string;
}): string {
  const lines = [
    `Pain: ${params.pain}`,
    `Agitate: ${params.agitate}`,
    `Solution: ${params.solution}`,
  ];

  if (params.proof) {
    lines.push(`Proof: ${params.proof}`);
  }

  if (params.urgency) {
    lines.push(`Urgency: ${params.urgency}`);
  }

  return lines.join("\n");
}

/**
 * Build a content intent from task/brief
 */
export function buildContentIntent(params: {
  goal: string;
  message: string;
  audience?: string;
  cta?: string;
  offer?: string;
}): string {
  const lines = [
    `Goal: ${params.goal}`,
    `Key Message: ${params.message}`,
  ];

  if (params.audience) {
    lines.push(`Audience: ${params.audience}`);
  }

  if (params.offer) {
    lines.push(`Offer: ${params.offer}`);
  }

  if (params.cta) {
    lines.push(`CTA: ${params.cta}`);
  }

  return lines.join("\n");
}

/**
 * Example usage for a price drop reel:
 * 
 * const contentIntent = buildContentIntent({
 *   goal: "Promote 3M IJ180 price drop",
 *   message: "Same premium film, better margins",
 *   audience: "Wrap shops and installers",
 *   offer: "$5.27 per sq ft (was $5.90)",
 *   cta: "Shop now at WePrintWraps.com",
 * });
 * 
 * const sabriFramework = buildSabriFramework({
 *   pain: "Margins are tight",
 *   agitate: "Most shops are paying more for the same film",
 *   solution: "WePrintWraps dropped the price without cutting quality",
 *   proof: "Same 3M IJ180. Same performance.",
 *   urgency: "Limited-time pricing",
 * });
 * 
 * const finalPrompt = buildFinalPrompt({
 *   contentIntent,
 *   persuasionFramework: sabriFramework,
 *   formatPrompt: DARA_FORMATS.grid_style.prompt,
 * });
 */
