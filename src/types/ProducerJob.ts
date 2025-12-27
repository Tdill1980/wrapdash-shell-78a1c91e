/**
 * ProducerJob: The authoritative, locked job from an agent
 * 
 * When an agent (like Noah) produces a CREATE_CONTENT block, we create
 * a ProducerJob that is LOCKED and cannot be overridden by auto-create.
 * 
 * This ensures:
 * - Clips are exactly as specified
 * - Overlays are exactly as specified
 * - No AI re-thinking or re-selection
 * - Direct path to render
 */

export interface ProducerJobClip {
  id: string;
  url: string;
  thumbnail?: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  suggestedOverlay?: string;
  reason?: string;
}

export interface ProducerJobOverlay {
  text: string;
  start: number;
  duration: number;
  position?: 'top' | 'center' | 'bottom';
  style?: 'bold' | 'minimal' | 'modern';
}

export interface ProducerJob {
  // Source tracking
  source: 'agent' | 'mightytask' | 'calendar' | 'manual';
  agentId?: string;
  taskId?: string;
  calendarId?: string;
  
  // Content specification
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook';
  contentType: 'reel' | 'story' | 'short';
  style?: string; // e.g., 'grid_style', 'ugc_style', etc.
  
  // THE LOCKED CONTENT - this is sacred
  clips: ProducerJobClip[];
  overlays: ProducerJobOverlay[];
  
  // Copy elements
  hook?: string;
  cta?: string;
  caption?: string;
  hashtags?: string[];
  
  // Music
  musicStyle?: 'upbeat' | 'cinematic' | 'hiphop' | 'none';
  musicUrl?: string;
  
  // 🔒 THE CRITICAL FLAG - when true, no auto-create runs
  lock: boolean;
  
  // Metadata
  createdAt: string;
}

/**
 * Navigation state that includes a ProducerJob
 */
export interface ProducerJobNavigationState {
  producerJob: ProducerJob;
  skipAutoCreate: true; // Always true when there's a ProducerJob
}

/**
 * Check if navigation state has a locked ProducerJob
 */
export function hasLockedProducerJob(state: any): state is ProducerJobNavigationState {
  return (
    state?.producerJob?.lock === true &&
    state?.skipAutoCreate === true &&
    Array.isArray(state?.producerJob?.clips)
  );
}
