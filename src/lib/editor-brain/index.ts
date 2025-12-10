/**
 * EDITOR AI BRAIN
 * 
 * Central export for the tri-mode Editor AI Brain system:
 * - Video Intelligence Engine (VIE)
 * - Creative Assembly Engine (CAE)  
 * - Render Translation Layer (RTL)
 * 
 * Supports three modes:
 * 1. Smart Assist - AI suggests, user controls
 * 2. Auto Create - AI builds, user approves
 * 3. Autonomous - Full AI content department
 */

// Video Intelligence Engine
export {
  analyzeVideo,
  type VideoAnalysis,
  type AnalyzedScene,
  type VideoAnalyzerOptions,
} from "./videoAnalyzer";

// Creative Assembly Engine
export {
  assembleCreative,
  generateVariants,
  type CreativeAssembly,
  type CreativeOverlay,
  type CreativeSequence,
  type ContentFormat,
  type EditorMode,
  type Platform,
  type AssemblerOptions,
} from "./creativeAssembler";

// Render Translation Layer
export {
  translateToCreatomate,
  createMultiPlatformRenderJobs,
  buildAdvancedTimeline,
  generateThumbnailSpec,
  exportCreativeAsJSON,
  validateTimeline,
  type CreatomateModifications,
  type CreatomateTimeline,
  type RenderJob,
  type BrandColors,
  type TranslatorOptions,
} from "./renderTranslator";

// Combined pipeline function for convenience
import { analyzeVideo, VideoAnalyzerOptions, VideoAnalysis } from "./videoAnalyzer";
import { assembleCreative, CreativeAssembly, EditorMode, Platform } from "./creativeAssembler";
import { translateToCreatomate, CreatomateTimeline, BrandColors } from "./renderTranslator";

export interface EditorBrainPipelineOptions {
  videoUrl: string;
  playbackUrl?: string;
  muxPlaybackId?: string;
  existingTranscript?: string;
  duration?: number;
  mode?: EditorMode;
  platform?: Platform;
  brandColors?: BrandColors;
  templateId?: string;
  musicUrl?: string;
  voiceProfile?: {
    tone?: string;
    vocabulary?: string[];
    cta_style?: string;
    brand_name?: string;
  };
}

export interface EditorBrainResult {
  analysis: VideoAnalysis;
  creative: CreativeAssembly;
  timeline: CreatomateTimeline;
}

/**
 * Full pipeline: Analyze → Assemble → Translate
 * Use this for one-shot content generation
 */
export async function runEditorBrainPipeline(
  options: EditorBrainPipelineOptions
): Promise<EditorBrainResult> {
  // Step 1: Analyze video
  const analysis = await analyzeVideo({
    playbackUrl: options.playbackUrl || options.videoUrl,
    muxPlaybackId: options.muxPlaybackId,
    existingTranscript: options.existingTranscript,
    duration: options.duration,
  });

  // Step 2: Assemble creative
  const creative = assembleCreative({
    analysis,
    mode: options.mode || "auto_create",
    platform: options.platform || "instagram",
    voiceProfile: options.voiceProfile,
  });

  // Step 3: Translate to render format
  const timeline = translateToCreatomate({
    creative,
    videoUrl: options.videoUrl,
    brandColors: options.brandColors,
    templateId: options.templateId,
    musicUrl: options.musicUrl,
  });

  return {
    analysis,
    creative,
    timeline,
  };
}
