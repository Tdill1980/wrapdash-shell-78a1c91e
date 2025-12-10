// src/lib/meta-ads/ctaMap.ts

export type MetaCTA =
  | "SHOP_NOW"
  | "ORDER_NOW"
  | "SIGN_UP"
  | "SUBSCRIBE"
  | "LEARN_MORE"
  | "GET_QUOTE"
  | "CONTACT_US"
  | "BOOK_NOW"
  | "GET_OFFER"
  | "SEND_MESSAGE";

export interface CTAOption {
  id: MetaCTA;
  label: string;
  description?: string;
}

export const CTA_OPTIONS: CTAOption[] = [
  { id: "SHOP_NOW", label: "Shop Now", description: "Direct purchase action" },
  { id: "ORDER_NOW", label: "Order Now", description: "Immediate order action" },
  { id: "GET_QUOTE", label: "Get Quote", description: "Request pricing" },
  { id: "LEARN_MORE", label: "Learn More", description: "Educational content" },
  { id: "BOOK_NOW", label: "Book Now", description: "Schedule appointment" },
  { id: "CONTACT_US", label: "Contact Us", description: "Open communication" },
  { id: "SIGN_UP", label: "Sign Up", description: "Registration action" },
  { id: "SUBSCRIBE", label: "Subscribe", description: "Newsletter/updates" },
  { id: "GET_OFFER", label: "Get Offer", description: "Special deal/discount" },
  { id: "SEND_MESSAGE", label: "Send Message", description: "Direct messaging" },
];

// Convert CTA text to button code for Meta Ads Manager
export function normalizeCTA(text: string): MetaCTA {
  const lower = text.toLowerCase().trim();

  if (lower.includes("shop")) return "SHOP_NOW";
  if (lower.includes("order")) return "ORDER_NOW";
  if (lower.includes("quote") || lower.includes("pricing")) return "GET_QUOTE";
  if (lower.includes("learn") || lower.includes("more")) return "LEARN_MORE";
  if (lower.includes("book") || lower.includes("schedule")) return "BOOK_NOW";
  if (lower.includes("contact")) return "CONTACT_US";
  if (lower.includes("sign")) return "SIGN_UP";
  if (lower.includes("offer") || lower.includes("deal")) return "GET_OFFER";
  if (lower.includes("message") || lower.includes("dm")) return "SEND_MESSAGE";

  return "LEARN_MORE";
}

// Get CTA label from ID
export function getCTALabel(id: MetaCTA): string {
  const option = CTA_OPTIONS.find((opt) => opt.id === id);
  return option?.label || "Learn More";
}

// Recommended CTAs for wrap industry
export const WRAP_INDUSTRY_CTAS: MetaCTA[] = [
  "GET_QUOTE",
  "SHOP_NOW",
  "BOOK_NOW",
  "CONTACT_US",
  "LEARN_MORE",
];
