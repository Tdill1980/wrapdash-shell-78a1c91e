/**
 * RENDER PREFLIGHT - FAIL FAST, NO GUESSING
 * 
 * This function validates that a SceneBlueprint is complete and ready to render.
 * If ANY required field is missing, it throws immediately with a human-readable error.
 * 
 * RULE: Nothing renders unless this passes.
 * RULE: No silent fixes allowed.
 */

import { SceneBlueprint } from "@/types/SceneBlueprint";

export interface RenderableError {
  field: string;
  message: string;
  sceneIndex?: number;
}

export class BlueprintNotRenderableError extends Error {
  errors: RenderableError[];
  
  constructor(errors: RenderableError[]) {
    const messages = errors.map(e => 
      e.sceneIndex !== undefined 
        ? `Scene ${e.sceneIndex + 1}: ${e.message}`
        : e.message
    );
    super(`Blueprint not renderable:\n- ${messages.join('\n- ')}`);
    this.name = 'BlueprintNotRenderableError';
    this.errors = errors;
  }
}

/**
 * Validates blueprint completeness for rendering.
 * Throws BlueprintNotRenderableError if any required fields are missing.
 * 
 * @param bp - The SceneBlueprint to validate
 * @returns true if valid (throws otherwise)
 */
export function assertRenderable(bp: SceneBlueprint | null | undefined): bp is SceneBlueprint {
  const errors: RenderableError[] = [];

  // ============ BLUEPRINT EXISTENCE ============
  if (!bp) {
    throw new BlueprintNotRenderableError([{ field: 'blueprint', message: 'No blueprint provided' }]);
  }

  // ============ TARGET LOCK (Format) ============
  if (!bp.format) {
    errors.push({ field: 'format', message: 'Missing format (reel/story/short)' });
  }

  if (!bp.aspectRatio) {
    errors.push({ field: 'aspectRatio', message: 'Missing aspect ratio' });
  }

  if (!bp.templateId) {
    errors.push({ field: 'templateId', message: 'Missing template ID' });
  }

  // ============ SCENES ============
  if (!bp.scenes || bp.scenes.length === 0) {
    errors.push({ field: 'scenes', message: 'No scenes defined' });
  } else {
    bp.scenes.forEach((scene, i) => {
      // Clip URL is required
      if (!scene.clipUrl) {
        errors.push({ 
          field: 'clipUrl', 
          message: 'Missing clip URL', 
          sceneIndex: i 
        });
      }

      // Timing is required
      if (scene.start === undefined || scene.start === null) {
        errors.push({ 
          field: 'start', 
          message: 'Missing start time', 
          sceneIndex: i 
        });
      }

      if (scene.end === undefined || scene.end === null) {
        errors.push({ 
          field: 'end', 
          message: 'Missing end time', 
          sceneIndex: i 
        });
      }

      // Validate timing logic
      if (scene.start !== undefined && scene.end !== undefined && scene.end <= scene.start) {
        errors.push({ 
          field: 'timing', 
          message: `Invalid timing: end (${scene.end}) must be greater than start (${scene.start})`, 
          sceneIndex: i 
        });
      }

      // Purpose is required for editorial clarity
      if (!scene.purpose) {
        errors.push({ 
          field: 'purpose', 
          message: 'Missing scene purpose', 
          sceneIndex: i 
        });
      }
    });
  }

  // ============ THROW IF INVALID ============
  if (errors.length > 0) {
    throw new BlueprintNotRenderableError(errors);
  }

  return true;
}

/**
 * Non-throwing version for UI validation
 * Returns validation result instead of throwing
 */
export function checkRenderable(bp: SceneBlueprint | null | undefined): { 
  valid: boolean; 
  errors: RenderableError[] 
} {
  try {
    assertRenderable(bp);
    return { valid: true, errors: [] };
  } catch (e) {
    if (e instanceof BlueprintNotRenderableError) {
      return { valid: false, errors: e.errors };
    }
    return { valid: false, errors: [{ field: 'unknown', message: String(e) }] };
  }
}
