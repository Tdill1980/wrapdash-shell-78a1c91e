/**
 * Ads Transformer
 * Converts Hybrid Output → Meta Ads Manager Ready Format
 */

interface HybridOutput {
  script?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  overlays?: Array<{ text: string; time: string; style: string }>;
  media_plan?: {
    cuts?: Array<{ description?: string; duration?: string; start?: number; end?: number }>;
    music_suggestion?: string;
    music_url?: string;
    color_palette?: string[];
    layout_template?: string;
  };
}

export interface MetaAdCreative {
  primary_text: string;
  headline: string;
  description: string;
  cta_button: "LEARN_MORE" | "SHOP_NOW" | "BOOK_NOW" | "GET_QUOTE" | "CONTACT_US" | "SIGN_UP";
  ad_objective: "CONVERSIONS" | "TRAFFIC" | "ENGAGEMENT" | "REACH" | "BRAND_AWARENESS";
  creative_type: "VIDEO" | "IMAGE" | "CAROUSEL";
  video_url?: string;
  image_url?: string;
  hashtags: string[];
  link_url?: string;
}

export interface AdExportPackage {
  meta_creative: MetaAdCreative;
  tiktok_creative?: {
    text: string;
    call_to_action: string;
    video_url?: string;
  };
  csv_row: Record<string, string>;
}

const CTA_MAP: Record<string, MetaAdCreative["cta_button"]> = {
  "learn more": "LEARN_MORE",
  "shop now": "SHOP_NOW",
  "book now": "BOOK_NOW",
  "get quote": "GET_QUOTE",
  "get a quote": "GET_QUOTE",
  "contact us": "CONTACT_US",
  "sign up": "SIGN_UP",
  "default": "LEARN_MORE",
};

function mapCTAButton(cta: string): MetaAdCreative["cta_button"] {
  const lowerCta = cta.toLowerCase();
  for (const [key, value] of Object.entries(CTA_MAP)) {
    if (lowerCta.includes(key)) {
      return value;
    }
  }
  return "LEARN_MORE";
}

export function buildMetaAdCreative(
  hybridOutput: HybridOutput,
  renderUrl: string,
  options?: {
    objective?: MetaAdCreative["ad_objective"];
    linkUrl?: string;
    creativeType?: MetaAdCreative["creative_type"];
  }
): MetaAdCreative {
  const primaryText = hybridOutput.caption || hybridOutput.script || "";
  const headline = hybridOutput.hook || "Transform Your Vehicle";
  const description = hybridOutput.cta || "Get your free quote today";
  
  return {
    primary_text: primaryText.slice(0, 500), // Meta's limit
    headline: headline.slice(0, 40), // Meta's limit
    description: description.slice(0, 125), // Meta's limit
    cta_button: hybridOutput.cta ? mapCTAButton(hybridOutput.cta) : "GET_QUOTE",
    ad_objective: options?.objective || "CONVERSIONS",
    creative_type: options?.creativeType || "VIDEO",
    video_url: options?.creativeType !== "IMAGE" ? renderUrl : undefined,
    image_url: options?.creativeType === "IMAGE" ? renderUrl : undefined,
    hashtags: hybridOutput.hashtags || [],
    link_url: options?.linkUrl,
  };
}

export function buildAdExportPackage(
  hybridOutput: HybridOutput,
  renderUrl: string,
  options?: {
    objective?: MetaAdCreative["ad_objective"];
    linkUrl?: string;
    creativeType?: MetaAdCreative["creative_type"];
  }
): AdExportPackage {
  const metaCreative = buildMetaAdCreative(hybridOutput, renderUrl, options);
  
  return {
    meta_creative: metaCreative,
    tiktok_creative: {
      text: hybridOutput.caption || hybridOutput.hook || "",
      call_to_action: hybridOutput.cta || "Learn More",
      video_url: renderUrl,
    },
    csv_row: {
      "Primary Text": metaCreative.primary_text,
      "Headline": metaCreative.headline,
      "Description": metaCreative.description,
      "CTA": metaCreative.cta_button,
      "Video URL": renderUrl,
      "Hashtags": metaCreative.hashtags.join(" "),
      "Link URL": options?.linkUrl || "",
    },
  };
}

export function exportAsCSV(packages: AdExportPackage[]): string {
  if (packages.length === 0) return "";
  
  const headers = Object.keys(packages[0].csv_row);
  const rows = packages.map((pkg) =>
    headers.map((h) => `"${(pkg.csv_row[h] || "").replace(/"/g, '""')}"`).join(",")
  );
  
  return [headers.join(","), ...rows].join("\n");
}

export function exportAsJSON(packages: AdExportPackage[]): string {
  return JSON.stringify(packages.map((p) => p.meta_creative), null, 2);
}
