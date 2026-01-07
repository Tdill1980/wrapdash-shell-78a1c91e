// ============================================
// WPW_STUDIO_V1 - Locked Render Specification
// ============================================
// This spec is IMMUTABLE once deployed.
// Any changes require creating WPW_STUDIO_V2.
// ============================================

import type { StudioViewKey, RenderSpecVersion } from '@/types/approveflow-os';

/**
 * Studio environment configuration.
 * These values are baked into render prompts.
 */
export interface StudioEnvironment {
  walls: {
    color: string;
    geometry: 'flat_planes_only';
    finish: 'matte';
  };
  floor: {
    material: string;
    reflections: boolean;
  };
  lighting: {
    type: 'hdri_softbox';
    visible_fixtures: false;
    color_temperature: 'neutral';
    key_light: string;
    fill_light: string;
    rim_light: string;
  };
}

/**
 * Camera configuration for a single view.
 */
export interface CameraConfig {
  label: string;
  fov: number;
  height_ft: number;
  distance_ft: number;
  prompt_camera: string;
  prompt_focus: string;
}

/**
 * Complete render specification.
 */
export interface RenderSpec {
  spec_id: RenderSpecVersion;
  version: string;
  created_at: string;
  locked: true;
  studio: StudioEnvironment;
  cameras: Record<StudioViewKey, CameraConfig>;
  required_views: StudioViewKey[];
}

/**
 * WPW_STUDIO_V1 - The canonical render specification.
 * 
 * LOCKED VALUES:
 * - Charcoal gray cyclorama studio
 * - Dark polished concrete floor
 * - 3-point automotive lighting
 * - 6 fixed camera positions
 */
export const WPW_STUDIO_V1: RenderSpec = {
  spec_id: 'WPW_STUDIO_V1',
  version: '1.0.0',
  created_at: '2026-01-07',
  locked: true,
  
  studio: {
    walls: {
      color: 'charcoal_gray',
      geometry: 'flat_planes_only',
      finish: 'matte',
    },
    floor: {
      material: 'polished_dark_concrete',
      reflections: true,
    },
    lighting: {
      type: 'hdri_softbox',
      visible_fixtures: false,
      color_temperature: 'neutral',
      key_light: 'Large softbox front-left at 45°, soft warm white',
      fill_light: 'Diffused front-right, 50% intensity',
      rim_light: 'Behind vehicle, subtle edge highlight',
    },
  },
  
  cameras: {
    driver_side: {
      label: 'Driver Side',
      fov: 45,
      height_ft: 4,
      distance_ft: 15,
      prompt_camera: '45-degree front-left three-quarter view, eye-level height (4 feet from ground), camera 15 feet from vehicle center',
      prompt_focus: 'Full vehicle visible, driver side prominently displayed, slight upward angle',
    },
    front: {
      label: 'Front',
      fov: 40,
      height_ft: 5,
      distance_ft: 12,
      prompt_camera: 'Straight-on front view, slightly elevated (5 feet height), centered on vehicle grille, camera 12 feet from bumper',
      prompt_focus: 'Symmetrical front view, hood and front fascia clearly visible',
    },
    rear: {
      label: 'Rear',
      fov: 40,
      height_ft: 5,
      distance_ft: 12,
      prompt_camera: 'Straight-on rear view, slightly elevated (5 feet height), centered on tailgate/trunk, camera 12 feet from bumper',
      prompt_focus: 'Symmetrical rear view, tailgate and rear fascia clearly visible',
    },
    passenger_side: {
      label: 'Passenger Side',
      fov: 45,
      height_ft: 4,
      distance_ft: 15,
      prompt_camera: '45-degree front-right three-quarter view, eye-level height (4 feet from ground), camera 15 feet from vehicle center',
      prompt_focus: 'Full vehicle visible, passenger side prominently displayed, slight upward angle',
    },
    top: {
      label: 'Top',
      fov: 60,
      height_ft: 20,
      distance_ft: 0,
      prompt_camera: 'Overhead drone-style view, camera directly above vehicle at 20 feet height, looking straight down',
      prompt_focus: 'Full roof and hood visible, vehicle centered in frame, slight forward angle showing hood',
    },
    detail: {
      label: 'Detail',
      fov: 25,
      height_ft: 3,
      distance_ft: 3,
      prompt_camera: 'Close-up macro shot of the most prominent design element (logo, main graphic, or key branding), camera 3 feet away',
      prompt_focus: 'Sharp focus on the main design element, shallow depth of field, professional product photography',
    },
  },
  
  required_views: ['driver_side', 'passenger_side', 'front', 'rear', 'top', 'detail'],
};

/**
 * Generate the studio environment prompt from the spec.
 */
export function getStudioPrompt(spec: RenderSpec = WPW_STUDIO_V1): string {
  return `
STUDIO ENVIRONMENT (LOCKED - DO NOT DEVIATE):
- Background: Seamless ${spec.studio.walls.color.replace('_', ' ')} cyclorama studio
- Floor: ${spec.studio.floor.material.replace(/_/g, ' ')}${spec.studio.floor.reflections ? ' with subtle reflections' : ''}
- Lighting: Professional 3-point automotive photography setup
  - Key light: ${spec.studio.lighting.key_light}
  - Fill light: ${spec.studio.lighting.fill_light}
  - Rim light: ${spec.studio.lighting.rim_light}
- Shadows: Realistic contact shadows under tires and body
- No props, no scenery, no sky, no text overlays
- Clean, professional automotive studio aesthetic
`.trim();
}

/**
 * Get camera prompt for a specific view.
 */
export function getCameraPrompt(
  viewKey: StudioViewKey, 
  spec: RenderSpec = WPW_STUDIO_V1
): { camera: string; focus: string } {
  const config = spec.cameras[viewKey];
  return {
    camera: config.prompt_camera,
    focus: config.prompt_focus,
  };
}

/**
 * Validate that render URLs match the spec.
 */
export function validateRenderOutput(
  renderUrls: Record<string, string>,
  spec: RenderSpec = WPW_STUDIO_V1
): {
  passed: boolean;
  checks: {
    all_views_present: boolean;
    no_invalid_keys: boolean;
    spec_version_matches: boolean;
  };
  missing_views: StudioViewKey[];
  invalid_keys: string[];
} {
  const urlKeys = Object.keys(renderUrls);
  const requiredViews = spec.required_views;
  
  // Check all required views are present
  const missing_views = requiredViews.filter(v => !renderUrls[v]);
  const all_views_present = missing_views.length === 0;
  
  // Check no invalid keys
  const invalid_keys = urlKeys.filter(k => !requiredViews.includes(k as StudioViewKey));
  const no_invalid_keys = invalid_keys.length === 0;
  
  // Spec version is always correct if using this function
  const spec_version_matches = true;
  
  return {
    passed: all_views_present && no_invalid_keys,
    checks: {
      all_views_present,
      no_invalid_keys,
      spec_version_matches,
    },
    missing_views,
    invalid_keys,
  };
}

export default WPW_STUDIO_V1;
