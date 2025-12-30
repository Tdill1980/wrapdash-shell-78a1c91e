/**
 * Blueprint V1 Schema - Canonical types for render pipeline
 * 
 * These types normalize various blueprint formats into a consistent structure.
 * All blueprints pass through validation before rendering.
 */

export type BlueprintSceneV1 = {
  scene_id: string;
  start_time: number; // seconds
  end_time: number;   // seconds
  clip_url: string;

  // Optional creative metadata
  purpose?: 'hook' | 'content' | 'proof' | 'cta' | 'logo' | 'b_roll' | 'pattern_interrupt' | 'payoff' | 'reveal' | string;
  text_overlay?: string | null;
  text_position?: 'top' | 'center' | 'bottom' | string;
  animation?: 'pop' | 'slide' | 'fade' | 'punch' | 'typewriter' | string;
  
  // For tracking/debugging
  clip_id?: string;
  cut_reason?: string;
};

export type SceneBlueprintV1 = {
  blueprint_id: string;
  blueprint_source?: string;
  format?: 'reel' | 'short' | 'story' | string;
  aspect_ratio?: '9:16' | '1:1' | '16:9' | string;
  template_id?: string;
  overlay_pack?: string;
  font?: string;
  text_style?: string;
  
  // Platform targeting
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | string;
  brand?: string;
  
  // Calculated total duration
  total_duration?: number;
  
  // Caption for the entire reel
  caption?: string;
  
  // End card config
  end_card?: {
    duration: number;
    text: string;
    cta: string;
  };

  // Required scenes array
  scenes: BlueprintSceneV1[];
  
  // Metadata
  created_at?: string;
};
