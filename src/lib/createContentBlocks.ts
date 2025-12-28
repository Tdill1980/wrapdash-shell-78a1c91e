// src/lib/createContentBlocks.ts
// Utilities for parsing and handling agent CREATE_CONTENT blocks

export const CREATE_BLOCK_START = "===CREATE_CONTENT===";
export const CREATE_BLOCK_END = "===END_CREATE_CONTENT===";

/**
 * Strip internal blocks from agent messages for display
 * This removes the raw CREATE_CONTENT blocks so users see natural language
 */
export function stripInternalBlocksForDisplay(text: string): string {
  if (!text) return text;

  // Remove CREATE_CONTENT blocks from what the user sees
  const createBlockRegex = /===CREATE_CONTENT===([\s\S]*?)===END_CREATE_CONTENT===/g;
  
  return text.replace(createBlockRegex, "").trim();
}

/**
 * Extract the raw CREATE_CONTENT block content (without markers)
 */
export function extractCreateContentBlock(text: string): string | null {
  if (!text) return null;

  const match = text.match(/===CREATE_CONTENT===([\s\S]*?)===END_CREATE_CONTENT===/);
  return match?.[1]?.trim() ?? null;
}

/**
 * Safe float parsing with fallback
 */
export function toFloat(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

// Parsed overlay structure
export interface ParsedOverlay {
  text: string;
  start: number;
  duration: number;
  position?: string;
  style?: string;
}

// Parsed CREATE_CONTENT structure
export interface ParsedCreateContent {
  action?: string;
  content_type?: string;
  platform?: string;
  asset_source?: string;
  asset_query?: {
    tags?: string[];
    type?: string;
    limit?: number;
  };
  attached_assets?: Array<{ url: string; type: string; name: string }>;
  hook?: string;
  cta?: string;
  caption?: string;
  hashtags?: string[];
  overlays?: ParsedOverlay[];
  raw?: string;
}

/**
 * Split hashtags from various formats:
 * "#a #b", "#a, #b", "a b", "a, b", newline-separated
 */
function splitHashtags(input?: string): string[] {
  if (!input) return [];
  return input
    .replace(/\n/g, " ")
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => (s.startsWith("#") ? s : `#${s}`));
}

/**
 * Parse time range like "0-3" or "0.5 - 3.5" into start + duration
 */
function parseTimeRange(range: string): { start: number; duration: number } | null {
  const m = range.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (!m) return null;
  const start = parseFloat(m[1]);
  const end = parseFloat(m[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return { start, duration: end - start };
}

/**
 * Robust CREATE_CONTENT parser that handles:
 * - Decimal numbers (0.5, 2.5)
 * - Time ranges ("0-3", "0.5-2.5")
 * - YAML-ish indentation
 * - Quoted values
 * - Various overlay formats
 */
export function parseCreateContent(rawMessage: string): ParsedCreateContent | null {
  const block = extractCreateContentBlock(rawMessage);
  if (!block) return null;

  const raw = block;
  const out: ParsedCreateContent = { overlays: [], raw };

  const lines = raw.split("\n");

  // Helper to get simple field values
  const getField = (name: string): string => {
    const regex = new RegExp(`^\\s*${name}\\s*:\\s*(.+?)\\s*$`, 'im');
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        let val = match[1].trim();
        // Strip surrounding quotes
        val = val.replace(/^["'](.+)["']$/, "$1");
        return val;
      }
    }
    return '';
  };

  // Capture simple fields
  out.action = getField('action') || 'create_content';
  out.content_type = getField('content_type') || 'reel';
  out.platform = getField('platform') || 'instagram';
  out.asset_source = getField('asset_source') || 'contentbox';
  out.hook = getField('hook');
  out.cta = getField('cta');
  out.caption = getField('caption');
  
  const hashtagsRaw = getField('hashtags');
  if (hashtagsRaw) {
    out.hashtags = splitHashtags(hashtagsRaw);
  }

  // Parse asset_query block
  const assetQueryMatch = raw.match(/asset_query:\s*\n((?:\s+\w+:.*\n?)+)/i);
  if (assetQueryMatch) {
    const queryBlock = assetQueryMatch[1];
    const tagsMatch = queryBlock.match(/tags:\s*\[([^\]]+)\]/i);
    const typeMatch = queryBlock.match(/type:\s*(\w+)/i);
    const limitMatch = queryBlock.match(/limit:\s*(\d+)/i);
    
    out.asset_query = {
      tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/["']/g, '')) : undefined,
      type: typeMatch ? typeMatch[1] : undefined,
      limit: limitMatch ? parseInt(limitMatch[1], 10) : undefined,
    };
  }

  // Parse attached_assets block
  const attachedAssetsMatch = raw.match(/attached_assets:\s*\n((?:\s+-.*\n?)+)/i);
  if (attachedAssetsMatch) {
    const assetBlocks = attachedAssetsMatch[1].split(/\n\s*-/).filter(Boolean);
    out.attached_assets = assetBlocks.map(block => {
      const urlMatch = block.match(/url:\s*(.+?)(?:\n|$)/i);
      const typeMatch = block.match(/type:\s*(\w+)/i);
      const nameMatch = block.match(/name:\s*(.+?)(?:\n|$)/i);
      return {
        url: urlMatch ? urlMatch[1].trim().replace(/["']/g, '') : '',
        type: typeMatch ? typeMatch[1].trim() : 'video',
        name: nameMatch ? nameMatch[1].trim().replace(/["']/g, '') : 'Attached Asset',
      };
    }).filter(a => a.url);
  }

  // ============ OVERLAY PARSING (THE CRITICAL FIX) ============
  // Support multiple formats:
  // 1. YAML array: overlays:\n  - text: ...\n    start: 0.5\n    duration: 2.5
  // 2. Time range: time: "0-3"
  // 3. Inline: "BIG TEXT" time: 0-3 position: top
  
  const overlayItems: string[] = [];
  const overlayStartIdx = lines.findIndex(l => /^\s*overlays\s*:\s*$/i.test(l));
  
  if (overlayStartIdx >= 0) {
    const after = lines.slice(overlayStartIdx + 1);
    // Collect until next top-level key or end
    const collected: string[] = [];
    for (const l of after) {
      // Check for next top-level key (not indented, has colon)
      if (/^[a-zA-Z_]+\s*:/.test(l) && !/^\s+-/.test(l)) break;
      collected.push(l);
    }
    
    // Split items by leading "-"
    let current: string[] = [];
    for (const l of collected) {
      if (/^\s*-\s*/.test(l)) {
        if (current.length) overlayItems.push(current.join("\n"));
        current = [l.replace(/^\s*-\s*/, "").trim()];
      } else if (current.length) {
        current.push(l.trim());
      }
    }
    if (current.length) overlayItems.push(current.join("\n"));
  }

  for (const item of overlayItems) {
    let text = "";
    let start: number | null = null;
    let duration: number | null = null;
    let position: string | undefined;
    let style: string | undefined;

    // Extract text field
    const textMatch = item.match(/text\s*:\s*["']?(.+?)["']?\s*(?:\n|$)/i);
    if (textMatch) {
      text = textMatch[1].trim().replace(/^["']|["']$/g, '');
    }

    // Extract position
    const posMatch = item.match(/position\s*:\s*["']?(\w+)["']?/i);
    if (posMatch) position = posMatch[1].trim();

    // Extract style
    const styleMatch = item.match(/style\s*:\s*["']?(\w+)["']?/i);
    if (styleMatch) style = styleMatch[1].trim();

    // Extract numeric start/duration (with decimal support!)
    const startMatch = item.match(/\bstart\s*:\s*([\d.]+)/i);
    const durationMatch = item.match(/\bduration\s*:\s*([\d.]+)/i);
    if (startMatch) start = parseFloat(startMatch[1]);
    if (durationMatch) duration = parseFloat(durationMatch[1]);

    // Try time range format: time: "0-3" or time: 0-3
    const timeStr = item.match(/\btime\s*:\s*["']?([\d.\s-]+)["']?/i)?.[1];
    if (timeStr) {
      const tr = parseTimeRange(timeStr);
      if (tr) {
        start = tr.start;
        duration = tr.duration;
      }
    }

    // Fallback: if item starts with a quoted string (inline overlay)
    if (!text) {
      const inlineMatch = item.match(/^["'](.+?)["']/);
      if (inlineMatch) text = inlineMatch[1];
    }

    // Skip if no text
    if (!text) continue;

    // Defaults for missing timing
    if (!Number.isFinite(start as number)) start = 0;
    if (!Number.isFinite(duration as number)) duration = 3;

    out.overlays!.push({
      text,
      start: start as number,
      duration: duration as number,
      position,
      style,
    });
  }

  // Debug log if overlays were in raw but none parsed
  if (/overlays\s*:/i.test(raw) && (!out.overlays || out.overlays.length === 0)) {
    console.debug("[parseCreateContent] overlays present but failed to parse", { raw });
  }

  return out;
}

/**
 * Validate a parsed CREATE_CONTENT block before allowing creation
 */
export function validateCreateContent(parsed: ParsedCreateContent | null): string[] {
  const errors: string[] = [];
  if (!parsed) {
    errors.push("Missing CREATE_CONTENT block");
    return errors;
  }
  if (!parsed.hook && !parsed.caption) {
    errors.push("Missing hook or caption");
  }
  // Overlays are optional - some content types don't need them
  return errors;
}
