/**
 * BLUEPRINT → CREATOMATE MAPPER
 * 
 * This is a PURE FUNCTION that converts a SceneBlueprint into a Creatomate render payload.
 * Same blueprint = same payload = same video (deterministic).
 * 
 * RULE: No mutations
 * RULE: No inference
 * RULE: No AI fixes
 */

import { SceneBlueprint, SceneBlueprintScene } from "@/types/SceneBlueprint";

export interface CreatomateElement {
  type: 'video' | 'text' | 'audio';
  source?: string;
  text?: string;
  time: number;
  duration: number;
  trim_start?: number;
  trim_duration?: number;
  x?: string;
  y?: string;
  width?: string;
  x_alignment?: string;
  y_alignment?: string;
  font_family?: string;
  font_weight?: string;
  font_size?: string;
  fill_color?: string;
  stroke_color?: string;
  stroke_width?: string;
  text_transform?: string;
  enter?: { type: string; duration: string; easing?: string };
  exit?: { type: string; duration: string };
  audio_fade_out?: string;
  volume?: string;
}

export interface CreatomatePayload {
  output_format: 'mp4';
  width: number;
  height: number;
  frame_rate: number;
  duration: number;
  elements: CreatomateElement[];
  metadata?: {
    blueprint_id: string;
    brand?: string;
    caption?: string;
    format?: string;
    overlay_pack?: string;
  };
}

/**
 * Maps text position to Creatomate x/y percentages
 */
function mapPositionToXY(position?: 'top' | 'center' | 'bottom'): { x: string; y: string } {
  switch (position) {
    case 'top':
      return { x: '50%', y: '12%' };
    case 'bottom':
      return { x: '50%', y: '88%' };
    case 'center':
    default:
      return { x: '50%', y: '50%' };
  }
}

/**
 * Maps animation type to Creatomate enter animation
 */
function mapAnimation(animation?: SceneBlueprintScene['animation']): CreatomateElement['enter'] {
  switch (animation) {
    case 'pop':
      return { type: 'scale', duration: '0.3 s', easing: 'back-out' };
    case 'slide':
      return { type: 'slide', duration: '0.4 s', easing: 'ease-out' };
    case 'fade':
      return { type: 'fade', duration: '0.3 s' };
    case 'punch':
      return { type: 'scale', duration: '0.2 s', easing: 'ease-out' };
    case 'typewriter':
      return { type: 'text-appear', duration: '0.5 s' };
    default:
      return { type: 'fade', duration: '0.3 s' };
  }
}

/**
 * Maps font name based on overlay pack
 */
function getFontFamily(font?: string, overlayPack?: string): string {
  if (font) return font;
  
  switch (overlayPack) {
    case 'wpw_signature':
      return 'Montserrat';
    case 'modern-clean':
      return 'Inter';
    case 'minimal':
      return 'SF Pro';
    case 'bold-impact':
      return 'Impact';
    default:
      return 'Montserrat';
  }
}

/**
 * Gets dimensions from aspect ratio
 */
function getDimensions(aspectRatio?: '9:16' | '1:1' | '16:9'): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1':
      return { width: 1080, height: 1080 };
    case '16:9':
      return { width: 1920, height: 1080 };
    case '9:16':
    default:
      return { width: 1080, height: 1920 };
  }
}

/**
 * Converts a SceneBlueprint into a Creatomate-ready payload.
 * This is the authoritative mapper - what comes out is what renders.
 * 
 * @param bp - The validated SceneBlueprint
 * @param musicUrl - Optional audio track URL
 * @returns CreatomatePayload ready for API submission
 */
export function mapBlueprintToCreatomate(
  bp: SceneBlueprint, 
  musicUrl?: string | null
): CreatomatePayload {
  const { width, height } = getDimensions(bp.aspectRatio);
  const fontFamily = getFontFamily(bp.font, bp.overlayPack);
  const elements: CreatomateElement[] = [];
  
  let timelineCursor = 0;

  // ============ BUILD VIDEO ELEMENTS ============
  for (const scene of bp.scenes) {
    const clipDuration = scene.end - scene.start;
    
    // Video element
    elements.push({
      type: 'video',
      source: scene.clipUrl,
      time: timelineCursor,
      duration: clipDuration,
      trim_start: scene.start,
      trim_duration: clipDuration,
    });

    // Text overlay (if present)
    if (scene.text && scene.text.trim()) {
      const { x, y } = mapPositionToXY(scene.textPosition);
      
      elements.push({
        type: 'text',
        text: scene.text,
        time: timelineCursor,
        duration: clipDuration,
        x,
        y,
        width: '90%',
        x_alignment: '50%',
        y_alignment: '50%',
        font_family: fontFamily,
        font_weight: bp.textStyle === 'bold' ? '800' : '600',
        font_size: '7 vh',
        fill_color: '#ffffff',
        stroke_color: '#000000',
        stroke_width: '1.5 vh',
        text_transform: 'uppercase',
        enter: mapAnimation(scene.animation),
        exit: { type: 'fade', duration: '0.2 s' },
      });
    }

    timelineCursor += clipDuration;
  }

  const totalDuration = timelineCursor;

  // ============ ADD END CARD (if present) ============
  if (bp.endCard) {
    const { x, y } = mapPositionToXY('center');
    
    elements.push({
      type: 'text',
      text: bp.endCard.text,
      time: totalDuration,
      duration: bp.endCard.duration,
      x,
      y,
      width: '80%',
      x_alignment: '50%',
      y_alignment: '50%',
      font_family: fontFamily,
      font_weight: '800',
      font_size: '8 vh',
      fill_color: '#ffffff',
      stroke_color: '#000000',
      stroke_width: '2 vh',
      text_transform: 'uppercase',
      enter: { type: 'scale', duration: '0.4 s', easing: 'back-out' },
    });
  }

  const finalDuration = bp.endCard 
    ? totalDuration + bp.endCard.duration 
    : totalDuration;

  // ============ ADD AUDIO TRACK ============
  if (musicUrl) {
    elements.push({
      type: 'audio',
      source: musicUrl,
      time: 0,
      duration: finalDuration,
      audio_fade_out: '1 s',
      volume: '60%',
    });
  }

  return {
    output_format: 'mp4',
    width,
    height,
    frame_rate: 30,
    duration: finalDuration,
    elements,
    metadata: {
      blueprint_id: bp.id,
      brand: bp.brand,
      caption: bp.caption,
      format: bp.format,
      overlay_pack: bp.overlayPack,
    },
  };
}
