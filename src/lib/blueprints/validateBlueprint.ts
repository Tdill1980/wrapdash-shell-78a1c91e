/**
 * Blueprint Validator & Normalizer
 * 
 * This module ensures ALL blueprints are valid before rendering.
 * It normalizes various input formats (camelCase, snake_case, legacy)
 * into the canonical V1 schema.
 * 
 * NO RENDER STARTS WITHOUT PASSING THIS GATE.
 */

import type { SceneBlueprintV1, BlueprintSceneV1 } from "./types";

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function toNumber(n: unknown): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string") {
    const x = Number(n);
    return Number.isFinite(x) ? x : null;
  }
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function sanitizeId(id: unknown, fallback: string): string {
  const s = String(id ?? "").trim();
  return s.length ? s : fallback;
}

/**
 * Custom error for blueprint validation failures
 */
export class BlueprintValidationError extends Error {
  details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "BlueprintValidationError";
    this.details = details;
  }
}

/**
 * Normalize & validate a SceneBlueprint.
 * Handles multiple input formats (camelCase, snake_case, legacy).
 * Throws BlueprintValidationError if invalid.
 */
export function validateAndNormalizeBlueprint(input: unknown): SceneBlueprintV1 {
  if (!input || typeof input !== "object") {
    throw new BlueprintValidationError("Blueprint must be an object");
  }

  const bp = input as Record<string, unknown>;

  // Extract blueprint ID from various possible fields
  const bpId = sanitizeId(
    bp.blueprint_id ?? bp.id ?? bp.blueprintId ?? "",
    ""
  );
  if (!bpId) {
    throw new BlueprintValidationError("Blueprint missing blueprint_id");
  }

  // Extract scenes array from various possible fields
  const scenesRaw = bp.scenes as unknown[];
  if (!Array.isArray(scenesRaw) || scenesRaw.length === 0) {
    throw new BlueprintValidationError("Blueprint has no scenes");
  }

  // Normalize each scene
  const normalizedScenes: BlueprintSceneV1[] = scenesRaw.map((s: unknown, idx: number) => {
    if (!s || typeof s !== "object") {
      throw new BlueprintValidationError(`Scene ${idx} must be an object`);
    }

    const scene = s as Record<string, unknown>;

    // Extract scene ID
    const scene_id = sanitizeId(
      scene.scene_id ?? scene.sceneId ?? scene.id ?? "",
      `scene_${idx + 1}`
    );

    // Extract timing - support multiple field names
    const start = toNumber(
      scene.start_time ?? scene.startTime ?? scene.start ?? scene.from
    );
    const end = toNumber(
      scene.end_time ?? scene.endTime ?? scene.end ?? scene.to
    );

    if (start == null || end == null) {
      throw new BlueprintValidationError(`Scene ${idx} missing timing`, { scene_id, start, end });
    }

    if (end <= start) {
      throw new BlueprintValidationError(`Scene ${idx} has invalid timing (end <= start)`, {
        scene_id,
        start,
        end,
      });
    }

    // Extract clip URL - support multiple field names
    const clip_url = String(
      scene.clip_url ?? scene.clipUrl ?? scene.url ?? scene.clip ?? ""
    ).trim();
    
    if (!clip_url) {
      throw new BlueprintValidationError(`Scene ${idx} missing clip_url`, { scene_id });
    }

    // Clamp for sanity (supports reels/shorts up to 1 hour)
    const start_time = clamp(start, 0, 3600);
    const end_time = clamp(end, 0, 3600);

    // Extract text overlay - support multiple field names
    const text_overlay = (scene.text_overlay ?? scene.textOverlay ?? scene.text ?? null) as string | null;

    return {
      scene_id,
      start_time,
      end_time,
      clip_url,
      clip_id: sanitizeId(scene.clip_id ?? scene.clipId ?? "", scene_id),
      purpose: (scene.purpose as string) || undefined,
      text_overlay,
      text_position: (scene.text_position ?? scene.textPosition) as string | undefined,
      animation: scene.animation as string | undefined,
      cut_reason: (scene.cut_reason ?? scene.cutReason) as string | undefined,
    };
  });

  // Sort scenes by start_time
  normalizedScenes.sort((a, b) => a.start_time - b.start_time);

  // Ensure unique scene IDs
  const seen = new Set<string>();
  for (let i = 0; i < normalizedScenes.length; i++) {
    let id = normalizedScenes[i].scene_id;
    if (seen.has(id)) {
      id = `${id}_${i + 1}`;
      normalizedScenes[i].scene_id = id;
    }
    seen.add(id);
  }

  // Calculate total duration from scenes
  const totalDuration = normalizedScenes.reduce(
    (sum, sc) => sum + (sc.end_time - sc.start_time),
    0
  );

  // Build normalized blueprint
  const normalized: SceneBlueprintV1 = {
    blueprint_id: bpId,
    blueprint_source: String(bp.blueprint_source ?? bp.blueprintSource ?? bp.source ?? "unknown"),
    format: String(bp.format ?? "reel"),
    aspect_ratio: String(bp.aspect_ratio ?? bp.aspectRatio ?? "9:16"),
    template_id: (bp.template_id ?? bp.templateId) as string | undefined,
    overlay_pack: (bp.overlay_pack ?? bp.overlayPack) as string | undefined,
    font: bp.font as string | undefined,
    text_style: (bp.text_style ?? bp.textStyle) as string | undefined,
    platform: (bp.platform as string) || undefined,
    brand: bp.brand as string | undefined,
    total_duration: toNumber(bp.totalDuration ?? bp.total_duration) ?? totalDuration,
    caption: bp.caption as string | undefined,
    end_card: (bp.end_card ?? bp.endCard) as SceneBlueprintV1['end_card'] | undefined,
    scenes: normalizedScenes,
    created_at: (bp.created_at ?? bp.createdAt ?? new Date().toISOString()) as string,
  };

  // Final validation gate: must have valid scenes
  if (!normalized.scenes.length) {
    throw new BlueprintValidationError("Blueprint scenes empty after normalization");
  }

  // Ensure all times are finite
  for (const sc of normalized.scenes) {
    if (!isFiniteNumber(sc.start_time) || !isFiniteNumber(sc.end_time)) {
      throw new BlueprintValidationError("Blueprint contains non-finite times", sc);
    }
  }

  return normalized;
}

/**
 * Non-throwing version - returns validation result instead of throwing
 */
export function checkBlueprint(input: unknown): { valid: boolean; errors: string[]; normalized?: SceneBlueprintV1 } {
  try {
    const normalized = validateAndNormalizeBlueprint(input);
    return { valid: true, errors: [], normalized };
  } catch (e) {
    if (e instanceof BlueprintValidationError) {
      return { valid: false, errors: [e.message] };
    }
    return { valid: false, errors: [e instanceof Error ? e.message : "Unknown error"] };
  }
}
