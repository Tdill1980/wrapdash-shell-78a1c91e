// Canonical execution resolver — single source of truth for content routing
// Maps brand + content_type + platform → agent/tool + route

export type Brand = "wpw" | "ink-edge" | "wraptv";

export type ContentType =
  | "email"
  | "reel"
  | "story"
  | "short"
  | "ad"
  | "article"
  | "post"
  | "ig_reel"
  | "ig_story"
  | "fb_reel"
  | "youtube_short"
  | "meta_ad";

export type ExecutionSurface = "mightytask" | "mightyedit" | "contentbox";

export interface ExecutionResolution {
  agentId?: string;
  route: string;
  executionSurface: ExecutionSurface;
  label: string;
}

// Agent ID constants matching AgentSelector.tsx
export const AGENT_IDS = {
  emily_carter: "emily_carter",      // Email Marketing
  noah_bennett: "noah_bennett",      // Social Content Creator
  ryan_mitchell: "ryan_mitchell",    // Editorial/Articles
  wraptvworld_producer: "wraptvworld_producer", // WrapTV video
} as const;

/**
 * Normalize brand string to canonical Brand type
 */
export function normalizeBrand(brand: string): Brand {
  const b = (brand || "").toLowerCase();
  if (b === "wpw" || b === "weprintWraps") return "wpw";
  if (b === "wraptv" || b === "wraptvworld") return "wraptv";
  if (b === "ink-edge" || b === "inkedge" || b === "ink & edge" || b === "i&e") return "ink-edge";
  return "wpw"; // Default fallback
}

/**
 * Normalize content type string to canonical ContentType
 */
export function normalizeContentType(contentType: string): ContentType {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("email")) return "email";
  if (ct === "ig_reel" || (ct.includes("reel") && ct.includes("ig"))) return "ig_reel";
  if (ct === "ig_story" || (ct.includes("story") && ct.includes("ig"))) return "ig_story";
  if (ct === "fb_reel" || (ct.includes("reel") && ct.includes("fb"))) return "fb_reel";
  if (ct === "youtube_short" || ct.includes("yt_short")) return "youtube_short";
  if (ct === "meta_ad" || ct.includes("meta")) return "meta_ad";
  if (ct.includes("story")) return "story";
  if (ct.includes("short")) return "short";
  if (ct.includes("article")) return "article";
  if (ct.includes("reel")) return "reel";
  if (ct.includes("ad")) return "ad";
  if (ct.includes("post")) return "post";
  return "post"; // Default fallback
}

/**
 * MAIN RESOLVER: Determines the ONE execution target for a content calendar item.
 * This is the orchestration layer's "sheet music".
 */
export function resolveExecutionTarget(
  brandRaw: string,
  contentTypeRaw: string,
  platform?: string | null
): ExecutionResolution {
  const brand = normalizeBrand(brandRaw);
  const contentType = normalizeContentType(contentTypeRaw);
  const pl = (platform || "").toLowerCase();

  // ═══════════════════════════════════════════════════════════
  // EMAIL (ALL BRANDS) → Emily Carter
  // ═══════════════════════════════════════════════════════════
  if (contentType === "email") {
    return {
      agentId: AGENT_IDS.emily_carter,
      route: "/mightytask",
      executionSurface: "mightytask",
      label: "Emily Carter (Email)",
    };
  }

  // ═══════════════════════════════════════════════════════════
  // WRAPTV: Video goes to MightyEdit (not an agent)
  // ═══════════════════════════════════════════════════════════
  if (brand === "wraptv") {
    if (["reel", "short", "ig_reel", "youtube_short", "fb_reel"].includes(contentType)) {
      return {
        route: "/mightyedit",
        executionSurface: "mightyedit",
        label: "MightyEdit (WrapTV)",
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // INK & EDGE
  // ═══════════════════════════════════════════════════════════
  if (brand === "ink-edge") {
    // Articles → Ryan Mitchell
    if (contentType === "article") {
      return {
        agentId: AGENT_IDS.ryan_mitchell,
        route: "/mightytask",
        executionSurface: "mightytask",
        label: "Ryan Mitchell (Article)",
      };
    }

    // Video content → Noah Bennett
    if (["reel", "story", "ig_reel", "ig_story", "fb_reel"].includes(contentType)) {
      return {
        agentId: AGENT_IDS.noah_bennett,
        route: "/mightytask",
        executionSurface: "mightytask",
        label: "Noah Bennett (Social)",
      };
    }

    // Default for I&E posts
    return {
      agentId: AGENT_IDS.noah_bennett,
      route: "/mightytask",
      executionSurface: "mightytask",
      label: "Noah Bennett (Content)",
    };
  }

  // ═══════════════════════════════════════════════════════════
  // WPW (Default brand)
  // ═══════════════════════════════════════════════════════════
  if (brand === "wpw") {
    // All video and ad content → Noah Bennett
    if (["reel", "story", "short", "ad", "ig_reel", "ig_story", "fb_reel", "youtube_short", "meta_ad"].includes(contentType)) {
      return {
        agentId: AGENT_IDS.noah_bennett,
        route: "/mightytask",
        executionSurface: "mightytask",
        label: "Noah Bennett (Social)",
      };
    }

    // Articles → Ryan Mitchell (if WPW ever has articles)
    if (contentType === "article") {
      return {
        agentId: AGENT_IDS.ryan_mitchell,
        route: "/mightytask",
        executionSurface: "mightytask",
        label: "Ryan Mitchell (Article)",
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FALLBACK → Noah Bennett (general content)
  // ═══════════════════════════════════════════════════════════
  return {
    agentId: AGENT_IDS.noah_bennett,
    route: "/mightytask",
    executionSurface: "mightytask",
    label: "Noah Bennett (Content)",
  };
}

// ═══════════════════════════════════════════════════════════
// SESSION STORAGE HELPERS
// ═══════════════════════════════════════════════════════════

export const EXECUTION_CONTEXT_KEY = "agent_chat_context";

export interface ExecutionContext {
  source: "content_calendar";
  content_calendar_id: string;
  brand: string;
  content_type: string;
  platform?: string | null;
  title?: string | null;
  caption?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
}

export function setExecutionContext(ctx: ExecutionContext): void {
  sessionStorage.setItem(EXECUTION_CONTEXT_KEY, JSON.stringify(ctx));
}

export function getExecutionContext(): ExecutionContext | null {
  const raw = sessionStorage.getItem(EXECUTION_CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExecutionContext;
  } catch {
    return null;
  }
}

export function clearExecutionContext(): void {
  sessionStorage.removeItem(EXECUTION_CONTEXT_KEY);
}

/**
 * Build the full route with calendarId query param
 */
export function buildExecutionRoute(resolution: ExecutionResolution, calendarId: string): string {
  const base = resolution.route;
  const hasQuery = base.includes("?");
  const separator = hasQuery ? "&" : "?";
  
  if (resolution.agentId) {
    return `${base}${separator}agent=${resolution.agentId}&calendarId=${calendarId}`;
  }
  
  return `${base}${separator}calendarId=${calendarId}`;
}
