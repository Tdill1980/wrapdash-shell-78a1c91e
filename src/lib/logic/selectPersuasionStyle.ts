/**
 * Auto-Select Persuasion Logic
 * 
 * Determines whether to use Sabri, Dara, or Clean style based on content context.
 * This ensures the right persuasion framework is applied without user intervention.
 */

export type PersuasionStyle = "sabri" | "dara" | "clean";

export interface PersuasionInput {
  content_goal?: string;
  wrap_type_category?: string;
  platform?: string;
  has_offer?: boolean;
  has_urgency?: boolean;
}

/**
 * Select persuasion style based on content context
 * 
 * Rules:
 * - Sabri = offer, pricing, urgency, business-focused
 * - Dara = storytelling, creator POV, UGC, restyle
 * - Clean = education, technical, default safe
 */
export function selectPersuasionStyle(input: PersuasionInput): PersuasionStyle {
  // Sabri = offers, pricing, urgency, promotions
  if (
    input.content_goal === "price_drop" ||
    input.content_goal === "promotion" ||
    input.content_goal === "sale" ||
    input.has_offer ||
    input.has_urgency
  ) {
    return "sabri";
  }

  // Dara = storytelling, creator POV, UGC, restyle transformations
  if (
    input.wrap_type_category === "restyle" &&
    (input.platform === "instagram" || input.platform === "tiktok")
  ) {
    return "dara";
  }

  // Dara for showcase content on social platforms
  if (
    input.content_goal === "showcase" &&
    (input.platform === "instagram" || input.platform === "tiktok")
  ) {
    return "dara";
  }

  // Clean for education and technical content
  if (input.content_goal === "education" || input.content_goal === "tutorial") {
    return "clean";
  }

  // Default to clean as the safest option
  return "clean";
}

/**
 * Get description for UI display
 */
export function getPersuasionStyleDescription(style: PersuasionStyle): string {
  switch (style) {
    case "sabri":
      return "Direct response copy with urgency and clear value proposition";
    case "dara":
      return "Story-driven content with creator POV and transformation narrative";
    case "clean":
      return "Professional, educational content without heavy persuasion";
  }
}

/**
 * Get emoji for UI display
 */
export function getPersuasionStyleEmoji(style: PersuasionStyle): string {
  switch (style) {
    case "sabri":
      return "🔥";
    case "dara":
      return "✨";
    case "clean":
      return "📋";
  }
}
