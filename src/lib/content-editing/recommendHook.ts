// Asset-driven hook recommendations (offline)

export type AssetType = 'video' | 'image' | 'before_after' | 'install' | 'product' | 'testimonial' | 'unknown';

export interface Asset {
  type?: string;
  tags?: string[];
  file_type?: string;
}

export function detectAssetType(asset: Asset): AssetType {
  const type = asset.type?.toLowerCase() || '';
  const tags = asset.tags?.map(t => t.toLowerCase()) || [];
  const fileType = asset.file_type?.toLowerCase() || '';
  
  if (tags.includes('before_after') || tags.includes('beforeafter')) return 'before_after';
  if (tags.includes('install') || tags.includes('installation')) return 'install';
  if (tags.includes('product')) return 'product';
  if (tags.includes('testimonial') || tags.includes('review')) return 'testimonial';
  if (fileType === 'video' || fileType === 'reel') return 'video';
  if (fileType === 'image' || fileType === 'photo') return 'image';
  if (type === 'video') return 'video';
  
  return 'unknown';
}

export interface HookRecommendation {
  templateId: string;
  templateName: string;
  reason: string;
}

export function recommendHook(assets: Asset[]): HookRecommendation {
  const types = assets.map(detectAssetType);
  
  if (types.includes('before_after')) {
    return {
      templateId: 'app_side_by_side',
      templateName: 'Side-by-Side Visual',
      reason: 'Best for before/after content',
    };
  }
  
  if (types.includes('video') || types.includes('install')) {
    return {
      templateId: 'app_proof_first',
      templateName: 'Proof First',
      reason: 'Real footage = instant trust',
    };
  }
  
  if (types.includes('testimonial')) {
    return {
      templateId: 'app_stop_scroll',
      templateName: 'Stop Scroll Installer',
      reason: 'Leverage social proof',
    };
  }
  
  if (types.includes('product')) {
    return {
      templateId: 'wpw_premium',
      templateName: 'Premium Quality',
      reason: 'Highlight product value',
    };
  }
  
  return {
    templateId: 'app_founder_truth',
    templateName: 'Founder Truth',
    reason: 'Default: founder credibility',
  };
}
