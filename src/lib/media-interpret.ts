// Media Interpretation Layer for Brand-Isolated Content Engine
// Analyzes media and transforms content to match brand style when auto-transform is enabled

export type BrandType = 'wpw' | 'wraptv' | 'inkandedge' | 'software';

export interface MediaAnalysis {
  raw_media: {
    url: string;
    type: 'image' | 'video' | 'reel';
    caption?: string;
  };
  detected_vehicle: {
    year?: string;
    make?: string;
    model?: string;
  } | null;
  detected_motion: 'static' | 'slow' | 'medium' | 'fast' | 'dynamic';
  detected_energy: 'low' | 'calm' | 'medium' | 'high' | 'hype';
  current_style: string;
  recommended_style: string;
  is_on_brand: boolean;
  brand_mismatch_reasons: string[];
  transformation_instructions: string;
}

export interface TransformOptions {
  autoTransform: boolean;
  targetBrand: BrandType;
}

const BRAND_STYLE_MAP: Record<BrandType, {
  style: string;
  energy_range: string[];
  motion_range: string[];
  forbidden_elements: string[];
}> = {
  wpw: {
    style: 'bold_direct_response',
    energy_range: ['medium', 'high'],
    motion_range: ['medium', 'fast'],
    forbidden_elements: ['memes', 'slang', 'cinematic_philosophy', 'software_demos']
  },
  wraptv: {
    style: 'viral_tiktok_fastcut',
    energy_range: ['high', 'hype'],
    motion_range: ['fast', 'dynamic'],
    forbidden_elements: ['b2b_messaging', 'slow_pacing', 'editorial_tone']
  },
  inkandedge: {
    style: 'cinematic_art',
    energy_range: ['low', 'calm', 'medium'],
    motion_range: ['static', 'slow'],
    forbidden_elements: ['hype', 'memes', 'direct_response', 'fast_cuts']
  },
  software: {
    style: 'modern_saas_explainer',
    energy_range: ['medium'],
    motion_range: ['medium'],
    forbidden_elements: ['entertainment', 'cinematic', 'memes', 'wholesale_messaging']
  }
};

export function getStyleForBrand(brand: BrandType): string {
  return BRAND_STYLE_MAP[brand]?.style || 'bold_direct_response';
}

export function getBrandTransformRules(brand: BrandType): string {
  switch (brand) {
    case 'wpw':
      return 'Convert any footage into commercial value messaging. Extract business benefits. Use direct response framing. Highlight speed, quality, and wholesale value.';
    case 'wraptv':
      return 'Increase hype, pacing, and cut style. Insert creator energy. Use trending hooks. Make it TikTok-native. Add personality and entertainment value.';
    case 'inkandedge':
      return 'Slow down pacing. Highlight beauty, craft, and artistry. Focus on texture, color, and transformation. Use poetic, editorial language.';
    case 'software':
      return 'Bridge media into problems solved by software. Extract product benefits. Focus on outcomes and ease of use. Modern, clean messaging.';
    default:
      return 'Analyze content and adapt to brand voice.';
  }
}

export function detectBrandMismatch(
  brand: BrandType,
  detectedEnergy: string,
  detectedMotion: string,
  detectedStyle?: string
): { isOnBrand: boolean; reasons: string[] } {
  const brandConfig = BRAND_STYLE_MAP[brand];
  const reasons: string[] = [];

  if (!brandConfig.energy_range.includes(detectedEnergy)) {
    reasons.push(`Energy level "${detectedEnergy}" doesn't match ${brand} (expected: ${brandConfig.energy_range.join(' or ')})`);
  }

  if (!brandConfig.motion_range.includes(detectedMotion)) {
    reasons.push(`Motion style "${detectedMotion}" doesn't match ${brand} (expected: ${brandConfig.motion_range.join(' or ')})`);
  }

  if (detectedStyle && detectedStyle !== brandConfig.style) {
    reasons.push(`Style "${detectedStyle}" differs from ${brand} style "${brandConfig.style}"`);
  }

  return {
    isOnBrand: reasons.length === 0,
    reasons
  };
}

export function interpretMediaForBrand(
  brand: BrandType,
  media: {
    url: string;
    type: 'image' | 'video' | 'reel';
    caption?: string;
    analysis?: {
      vehicle?: { year?: string; make?: string; model?: string };
      energy?: string;
      motion?: string;
      style?: string;
    };
  },
  options: TransformOptions = { autoTransform: false, targetBrand: brand }
): MediaAnalysis {
  const analysis = media.analysis || {};
  const detectedEnergy = analysis.energy || 'medium';
  const detectedMotion = analysis.motion || 'medium';
  const detectedStyle = analysis.style || 'unknown';

  const mismatchCheck = detectBrandMismatch(
    brand,
    detectedEnergy,
    detectedMotion,
    detectedStyle
  );

  const result: MediaAnalysis = {
    raw_media: {
      url: media.url,
      type: media.type,
      caption: media.caption
    },
    detected_vehicle: analysis.vehicle || null,
    detected_motion: detectedMotion as MediaAnalysis['detected_motion'],
    detected_energy: detectedEnergy as MediaAnalysis['detected_energy'],
    current_style: detectedStyle,
    recommended_style: getStyleForBrand(brand),
    is_on_brand: mismatchCheck.isOnBrand,
    brand_mismatch_reasons: mismatchCheck.reasons,
    transformation_instructions: ''
  };

  // Only provide transformation instructions if auto-transform is enabled
  if (options.autoTransform && !mismatchCheck.isOnBrand) {
    result.transformation_instructions = getBrandTransformRules(brand);
  } else if (!mismatchCheck.isOnBrand) {
    result.transformation_instructions = `[AUTO-TRANSFORM OFF] Content may not match ${brand.toUpperCase()} brand style. Enable auto-transform to convert.`;
  }

  return result;
}

export function generateBrandWarning(analysis: MediaAnalysis, brand: BrandType): string | null {
  if (analysis.is_on_brand) return null;

  const warnings = analysis.brand_mismatch_reasons.map(r => `• ${r}`).join('\n');
  return `⚠️ Brand Mismatch Detected for ${brand.toUpperCase()}:\n${warnings}\n\nEnable "Auto-Transform" to convert this content to match ${brand} brand guidelines.`;
}
