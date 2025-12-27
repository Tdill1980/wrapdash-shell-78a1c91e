/**
 * AutoCreateInput: The authoritative contract for AI Auto-Create
 * 
 * This defines exactly WHY a reel is being created and what parameters to use.
 * When this is passed to ReelBuilder, Auto-Create runs automatically with these settings.
 * No guessing, no defaults, no UI interaction required.
 */

export interface AutoCreateInput {
  // Source of the auto-create request
  source: 'mightytask' | 'content_calendar' | 'manual';
  
  // Source references for linking back
  taskId?: string;
  calendarId?: string;
  
  // Content specification
  contentType: 'reel' | 'story' | 'short';
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook';
  
  // THE EXACT topic from calendar/task - this is the magic
  topic: string;
  hook?: string;
  cta?: string;
  
  // Style preferences (maps to DaraFormatType)
  style: 'dara' | 'sabri' | 'clean' | 'grid_style' | 'creator_testimonial' | 'problem_solution' | 'listicle' | 'before_after' | 'day_in_life' | 'founder_story';
  musicStyle?: 'hiphop' | 'cinematic' | 'upbeat' | 'none';
  captionStyle?: 'sabri' | 'dara' | 'clean';
  
  // Brand
  brand: string;
}

/**
 * State passed via navigation to ReelBuilder for automatic execution
 */
export interface AutoCreateNavigationState {
  // Flag to trigger auto-run
  autoCreate?: boolean;
  
  // The authoritative input contract
  autoCreateInput?: AutoCreateInput;
  
  // Legacy support for ContentBox flow
  autoCreatedClips?: Array<{
    id: string;
    order: number;
    trim_start: number;
    trim_end: number;
    reason?: string;
    suggested_overlay?: string;
    file_url?: string;
    thumbnail_url?: string;
    original_filename?: string;
    duration_seconds?: number;
  }>;
  reelConcept?: string;
  suggestedHook?: string;
  suggestedCta?: string;
  musicVibe?: string;
  autoRunSmartAssist?: boolean;
}

/**
 * Map channel keys to brand identifiers
 */
export function getChannelBrand(channel?: string | null): string {
  const channelBrandMap: Record<string, string> = {
    'wpw': 'WPW',
    'ink_edge_publisher': 'InkEdge',
    'ink_edge_content': 'InkEdge',
    'wraptvworld': 'WrapTV',
  };
  return channelBrandMap[channel || ''] || 'WPW';
}

/**
 * Map content types to platform defaults
 */
export function getPlatformFromContentType(contentType?: string | null): 'instagram' | 'tiktok' | 'youtube' | 'facebook' {
  const contentTypePlatformMap: Record<string, 'instagram' | 'tiktok' | 'youtube' | 'facebook'> = {
    'ig_reel': 'instagram',
    'ig_story': 'instagram',
    'fb_reel': 'facebook',
    'fb_story': 'facebook',
    'youtube_short': 'youtube',
    'youtube_video': 'youtube',
    'tiktok': 'tiktok',
    'reel': 'instagram',
    'story': 'instagram',
  };
  return contentTypePlatformMap[contentType || ''] || 'instagram';
}
