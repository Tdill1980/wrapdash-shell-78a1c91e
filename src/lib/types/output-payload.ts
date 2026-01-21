/**
 * Output Payload Types
 * Structured multi-platform export payload for ai_creatives
 * 
 * This is the canonical contract between AI output and all download/export UIs
 */

export interface MetaAdPayload {
  headline?: string;
  primary_text?: string;
  description?: string;
  cta_button?: "LEARN_MORE" | "SHOP_NOW" | "BOOK_NOW" | "GET_QUOTE" | "CONTACT_US" | "SIGN_UP";
  hashtags?: string[];
  video_url?: string;
  image_url?: string;
  placement?: string;
  short_texts?: string[];
  long_texts?: string[];
  headlines?: string[];
  descriptions?: string[];
  angles?: Array<{
    name: string;
    primary_text: string;
    headline: string;
  }>;
}

export interface ReelPayload {
  video_url?: string;
  caption?: string;
  hooks?: string[];
  format?: string;
  platform?: string;
  aspect_ratio?: string;
  duration?: number;
  scenes_count?: number;
  content_type?: string;
}

export interface CarouselPayload {
  slides?: Array<{
    image_url?: string;
    headline?: string;
    caption?: string;
  }>;
  captions?: string[];
}

export interface StaticPayload {
  images?: string[];
  copy?: {
    headline?: string;
    body?: string;
    cta?: string;
  };
}

export interface CsvPayload {
  headers?: string[];
  row?: Record<string, string>;
  rows?: Array<Record<string, string>>;
}

export interface TikTokPayload {
  text?: string;
  call_to_action?: string;
  video_url?: string;
  hashtags?: string[];
}

/**
 * Main output_payload structure stored in ai_creatives.output_payload
 */
export interface OutputPayload {
  // Platform-specific payloads
  meta?: MetaAdPayload;
  reel?: ReelPayload;
  carousel?: CarouselPayload;
  static?: StaticPayload;
  tiktok?: TikTokPayload;
  
  // CSV export data
  csv?: CsvPayload;
  
  // Metadata
  generated_at?: string;
  rendered_at?: string;
  renderer?: string;
  render_id?: string;
}

/**
 * Type guard to check if output_payload has meta ad data
 */
export function hasMetaPayload(payload: OutputPayload | null | undefined): payload is OutputPayload & { meta: MetaAdPayload } {
  return !!payload?.meta;
}

/**
 * Type guard to check if output_payload has reel data
 */
export function hasReelPayload(payload: OutputPayload | null | undefined): payload is OutputPayload & { reel: ReelPayload } {
  return !!payload?.reel;
}

/**
 * Type guard to check if output_payload has CSV export data
 */
export function hasCsvPayload(payload: OutputPayload | null | undefined): payload is OutputPayload & { csv: CsvPayload } {
  return !!payload?.csv;
}

/**
 * Convert OutputPayload to CSV string for export
 */
export function outputPayloadToCSV(payload: OutputPayload): string {
  if (!payload.csv) return "";
  
  const { headers, row, rows } = payload.csv;
  
  // Single row format
  if (row && headers) {
    const headerLine = headers.join(",");
    const valueLine = headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",");
    return `${headerLine}\n${valueLine}`;
  }
  
  // Multiple rows format
  if (rows && rows.length > 0) {
    const allHeaders = headers || Object.keys(rows[0]);
    const headerLine = allHeaders.join(",");
    const valueLines = rows.map(r => 
      allHeaders.map(h => `"${(r[h] || "").replace(/"/g, '""')}"`).join(",")
    );
    return [headerLine, ...valueLines].join("\n");
  }
  
  return "";
}

/**
 * Extract Meta Ad creative from OutputPayload for AdExportDisplay
 */
export function extractMetaAdCreative(payload: OutputPayload): MetaAdPayload | null {
  return payload.meta || null;
}
