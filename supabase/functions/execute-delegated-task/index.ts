import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * execute-delegated-task
 * 
 * The Ops Desk Executor - takes a task_id, determines the task type,
 * and routes to the appropriate content creation/execution function.
 * 
 * Enhanced with:
 * - Platform-aware video blueprint generation
 * - ContentBox asset scanning
 * - Content calendar integration for platform/goal context
 */

interface TaskContext {
  video_urls?: string[];
  image_urls?: string[];
  content_type?: string;
  platform?: string;
  goal?: string;
  brand_tone?: string;
  dara_format?: string;
  organization_id?: string;
  mightytask_id?: string;
  content_calendar_id?: string;
  chat_context?: Record<string, unknown>;
}

interface ContentCalendarItem {
  id: string;
  platform: string;
  content_type: string;
  title: string;
  caption: string;
  brand: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[execute-delegated-task] ====== FUNCTION INVOKED ======");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { task_id, context: providedContext } = await req.json();

    if (!task_id) {
      throw new Error("task_id is required");
    }

    console.log("[execute-delegated-task] Processing task:", task_id);
    console.log("[execute-delegated-task] Provided context:", JSON.stringify(providedContext || {}));

    // Step 1: Fetch the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      throw new Error(`Task not found: ${taskError?.message || "No data"}`);
    }

    console.log("[execute-delegated-task] Task found:", {
      id: task.id,
      title: task.title,
      content_type: task.content_type,
      content_calendar_id: task.content_calendar_id,
      status: task.status,
      assigned_agent: task.assigned_agent
    });

    // Step 2: Update task to in_progress
    await supabase
      .from("tasks")
      .update({ 
        status: "in_progress", 
        updated_at: new Date().toISOString() 
      })
      .eq("id", task_id);

    // Step 3: Fetch content calendar item if linked
    let calendarItem: ContentCalendarItem | null = null;
    if (task.content_calendar_id) {
      const { data: calendar } = await supabase
        .from("content_calendar")
        .select("id, platform, content_type, title, caption, brand")
        .eq("id", task.content_calendar_id)
        .single();
      
      if (calendar) {
        calendarItem = calendar as ContentCalendarItem;
        console.log("[execute-delegated-task] Calendar item found:", calendarItem);
      }
    }

    // Step 4: Parse task type and gather context
    const taskContext = parseTaskContext(task, providedContext || {}, calendarItem);
    console.log("[execute-delegated-task] Parsed context:", JSON.stringify(taskContext));

    // Step 5: Scan ContentBox for available assets
    const assets = await scanContentBoxAssets(supabase, taskContext.organization_id || task.organization_id);
    console.log("[execute-delegated-task] ContentBox assets found:", {
      videos: assets.videos.length,
      images: assets.images.length
    });

    // Step 6: Determine execution path based on content type
    const contentType = taskContext.content_type || inferContentType(task.title, task.description, calendarItem);
    console.log("[execute-delegated-task] Determined content type:", contentType);

    let executionResult: any = null;
    let outputUrl: string | null = null;

    // Route to appropriate executor
    switch (contentType) {
      case "ig_reel":
      case "fb_reel":
      case "youtube_short":
      case "reel":
      case "video":
        executionResult = await executeVideoContent(supabase, task, taskContext, assets, calendarItem);
        outputUrl = executionResult?.download_url || executionResult?.render_result?.download_url;
        break;

      case "ig_story":
      case "fb_story":
      case "story":
        executionResult = await executeStoryContent(supabase, task, taskContext, assets);
        outputUrl = executionResult?.output_url;
        break;

      case "meta_ad":
      case "static_ad":
      case "ad":
        executionResult = await executeStaticAd(supabase, task, taskContext, assets);
        outputUrl = executionResult?.output_url;
        break;

      default:
        console.log("[execute-delegated-task] Unknown content type, attempting video execution");
        executionResult = await executeVideoContent(supabase, task, taskContext, assets, calendarItem);
        outputUrl = executionResult?.download_url || executionResult?.render_result?.download_url;
    }

    // Step 7: Update task with results
    const isSuccess = executionResult?.success !== false;
    const finalStatus = isSuccess ? "completed" : "failed";

    const updateData: Record<string, unknown> = {
      status: finalStatus,
      updated_at: new Date().toISOString(),
      notes: isSuccess 
        ? `Executed successfully. ${outputUrl ? `Output: ${outputUrl}` : ""}`
        : `Execution failed: ${executionResult?.error || "Unknown error"}`
    };

    if (isSuccess) {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", task_id);

    // Step 8: Create content draft if successful
    if (isSuccess && outputUrl && taskContext.organization_id) {
      const platform = calendarItem?.platform || 
        (contentType.startsWith("ig_") ? "instagram" : 
         contentType.startsWith("fb_") ? "facebook" :
         contentType.startsWith("youtube_") ? "youtube" : "instagram");

      await supabase
        .from("content_drafts")
        .insert({
          organization_id: taskContext.organization_id,
          task_id: task_id,
          content_type: contentType,
          platform: platform,
          media_url: outputUrl,
          status: "pending_review",
          caption: calendarItem?.caption || task.title,
          created_by_agent: task.assigned_agent || "ops_desk"
        });
    }

    console.log("[execute-delegated-task] ====== EXECUTION COMPLETE ======");
    console.log("[execute-delegated-task] Result:", { success: isSuccess, outputUrl, status: finalStatus });

    return new Response(
      JSON.stringify({
        success: isSuccess,
        task_id,
        status: finalStatus,
        output_url: outputUrl,
        execution_result: executionResult,
        platform: calendarItem?.platform,
        content_type: contentType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[execute-delegated-task] FATAL ERROR:", err);
    
    // Try to update task as failed
    try {
      const { task_id } = await req.clone().json().catch(() => ({}));
      if (task_id) {
        await supabase
          .from("tasks")
          .update({ 
            status: "failed", 
            notes: `Execution error: ${err instanceof Error ? err.message : "Unknown"}`,
            updated_at: new Date().toISOString() 
          })
          .eq("id", task_id);
      }
    } catch {
      // Ignore update errors
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Scan ContentBox for available video and image assets
 */
async function scanContentBoxAssets(supabase: any, organizationId: string | undefined) {
  const assets = { videos: [] as any[], images: [] as any[] };

  if (!organizationId) return assets;

  // Fetch videos
  const { data: videos } = await supabase
    .from("content_files")
    .select("id, file_url, original_filename, duration_seconds, tags, content_category, thumbnail_url")
    .eq("organization_id", organizationId)
    .eq("file_type", "video")
    .order("created_at", { ascending: false })
    .limit(20);

  if (videos) {
    assets.videos = videos.map((v: any) => ({
      id: v.id,
      file_url: v.file_url,
      filename: v.original_filename || "Untitled",
      duration_seconds: v.duration_seconds || 10,
      tags: v.tags || [],
      category: v.content_category || "raw",
      thumbnail_url: v.thumbnail_url
    }));
  }

  // Fetch images
  const { data: images } = await supabase
    .from("content_files")
    .select("id, file_url, original_filename, tags, content_category, thumbnail_url")
    .eq("organization_id", organizationId)
    .eq("file_type", "image")
    .order("created_at", { ascending: false })
    .limit(20);

  if (images) {
    assets.images = images.map((i: any) => ({
      id: i.id,
      file_url: i.file_url,
      filename: i.original_filename || "Untitled",
      tags: i.tags || [],
      category: i.content_category || "raw",
      thumbnail_url: i.thumbnail_url
    }));
  }

  return assets;
}

/**
 * Parse task context from task data and provided context
 */
function parseTaskContext(
  task: any, 
  providedContext: Record<string, unknown>,
  calendarItem: ContentCalendarItem | null
): TaskContext {
  const context: TaskContext = {
    organization_id: task.organization_id,
    content_type: task.content_type || calendarItem?.content_type,
    platform: calendarItem?.platform,
    content_calendar_id: task.content_calendar_id,
    brand_tone: calendarItem?.brand || "professional"
  };

  // Extract from provided context
  if (providedContext.video_urls) {
    context.video_urls = providedContext.video_urls as string[];
  }
  if (providedContext.image_urls) {
    context.image_urls = providedContext.image_urls as string[];
  }
  if (providedContext.platform) {
    context.platform = providedContext.platform as string;
  }
  if (providedContext.goal) {
    context.goal = providedContext.goal as string;
  }
  if (providedContext.dara_format) {
    context.dara_format = providedContext.dara_format as string;
  }
  if (providedContext.chat_context) {
    context.chat_context = providedContext.chat_context as Record<string, unknown>;
  }

  // Try to extract URLs from task description
  const urlPattern = /https?:\/\/[^\s"'<>]+\.(mp4|mov|webm|jpg|jpeg|png|gif|webp)/gi;
  const descUrls = (task.description || "").match(urlPattern) || [];
  const titleUrls = (task.title || "").match(urlPattern) || [];
  const allUrls = [...descUrls, ...titleUrls];

  allUrls.forEach((url: string) => {
    if (url.match(/\.(mp4|mov|webm)$/i)) {
      if (!context.video_urls) context.video_urls = [];
      if (!context.video_urls.includes(url)) context.video_urls.push(url);
    } else {
      if (!context.image_urls) context.image_urls = [];
      if (!context.image_urls.includes(url)) context.image_urls.push(url);
    }
  });

  return context;
}

/**
 * Infer content type from task title/description/calendar
 */
function inferContentType(
  title: string, 
  description: string | null,
  calendarItem: ContentCalendarItem | null
): string {
  // Use calendar item content type if available
  if (calendarItem?.content_type) {
    return calendarItem.content_type;
  }

  const text = `${title} ${description || ""}`.toLowerCase();

  if (text.includes("reel")) return "reel";
  if (text.includes("story")) return "story";
  if (text.includes("short")) return "youtube_short";
  if (text.includes("ad") || text.includes("advertisement")) return "meta_ad";
  if (text.includes("static")) return "static_ad";
  if (text.includes("video")) return "reel";
  if (text.includes("post") || text.includes("content")) return "reel";

  // Default to reel
  return "reel";
}

/**
 * Execute video/reel content creation with platform-aware blueprint
 */
async function executeVideoContent(
  supabase: any, 
  task: any, 
  context: TaskContext,
  assets: { videos: any[], images: any[] },
  calendarItem: ContentCalendarItem | null
): Promise<any> {
  console.log("[execute-delegated-task] Executing video content with platform awareness...");

  // Determine platform from calendar or context
  const platform = context.platform || calendarItem?.platform || "instagram";
  const goal = context.goal || "engagement";
  const brandTone = context.brand_tone || calendarItem?.brand || "professional";

  console.log("[execute-delegated-task] Platform context:", { platform, goal, brandTone });

  // If we have a specific video URL, use single video mode
  const videoUrl = context.video_urls?.[0];

  // Step 1: Generate platform-aware blueprint with creative context
  console.log("[execute-delegated-task] Generating platform-aware video blueprint...");
  
  // Build creative context from task + calendar (THE MISSING LINK)
  const creativeContext = {
    task_title: task.title,
    task_description: task.description,
    calendar_title: calendarItem?.title,
    calendar_caption: calendarItem?.caption,
    platform: calendarItem?.platform || platform,
    brand: calendarItem?.brand || brandTone,
  };
  
  console.log("[execute-delegated-task] Creative context:", creativeContext);
  
  const { data: blueprint, error: blueprintError } = await supabase.functions.invoke("ai-generate-video-blueprint", {
    body: {
      platform: platform,
      goal: goal,
      brand_tone: brandTone,
      available_clips: assets.videos,
      organization_id: context.organization_id,
      content_calendar_id: context.content_calendar_id,
      task_id: task.id,
      creative_context: creativeContext, // ✅ PASS INTENT
    }
  });

  if (blueprintError) {
    console.error("[execute-delegated-task] Blueprint generation error:", blueprintError);
    // Fall back to legacy ai-auto-create-reel
    return executeLegacyVideoContent(supabase, task, context, videoUrl);
  }

  console.log("[execute-delegated-task] Blueprint generated:", {
    platform: blueprint.platform,
    scenes: blueprint.scenes?.length,
    duration: blueprint.total_duration_seconds
  });

  // Step 2: Create video_edit_queue entry with blueprint
  const { data: editEntry, error: editError } = await supabase
    .from("video_edit_queue")
    .insert({
      organization_id: context.organization_id,
      source_url: videoUrl || assets.videos[0]?.file_url,
      title: calendarItem?.title || task.title,
      status: "pending",
      render_status: "pending",
      ai_edit_suggestions: {
        blueprint: blueprint,
        scenes: blueprint.scenes || [],
        platform: blueprint.platform,
        aspect_ratio: blueprint.aspect_ratio,
        music_energy: blueprint.music_energy,
        end_card: blueprint.end_card
      }
    })
    .select()
    .single();

  if (editError) {
    console.error("[execute-delegated-task] Failed to create edit entry:", editError);
    return { success: false, error: editError.message };
  }

  console.log("[execute-delegated-task] Video edit entry created:", editEntry.id);

  // Step 3: Execute the edits
  const { data: executeResult, error: executeError } = await supabase.functions.invoke("ai-execute-edits", {
    body: {
      video_edit_id: editEntry.id,
      render_type: "full",
      organization_id: context.organization_id,
      use_blueprint: true
    }
  });

  if (executeError) {
    console.error("[execute-delegated-task] ai-execute-edits error:", executeError);
    return { success: false, error: executeError.message };
  }

  console.log("[execute-delegated-task] Execution result:", JSON.stringify(executeResult));

  return {
    success: executeResult.success !== false,
    video_edit_id: editEntry.id,
    render_result: executeResult,
    download_url: executeResult.download_url,
    blueprint: blueprint
  };
}

/**
 * Fallback to legacy video content creation
 */
async function executeLegacyVideoContent(
  supabase: any,
  task: any,
  context: TaskContext,
  videoUrl: string | undefined
): Promise<any> {
  console.log("[execute-delegated-task] Using legacy ai-auto-create-reel...");

  if (!videoUrl && !context.organization_id) {
    return { success: false, error: "No video content available" };
  }

  // Call legacy ai-auto-create-reel
  const { data: reelPlan, error: reelError } = await supabase.functions.invoke("ai-auto-create-reel", {
    body: {
      organization_id: context.organization_id,
      video_url: videoUrl,
      video_duration: 60,
      dara_format: context.dara_format || "ugc_warehouse"
    }
  });

  if (reelError) {
    console.error("[execute-delegated-task] ai-auto-create-reel error:", reelError);
    return { success: false, error: reelError.message };
  }

  // Create video_edit_queue entry
  const { data: editEntry, error: editError } = await supabase
    .from("video_edit_queue")
    .insert({
      organization_id: context.organization_id,
      source_url: videoUrl || reelPlan.selected_videos?.[0]?.file_url,
      title: task.title,
      status: "pending",
      render_status: "pending",
      ai_edit_suggestions: {
        scenes: reelPlan.selected_videos || [],
        reel_concept: reelPlan.reel_concept,
        suggested_hook: reelPlan.suggested_hook,
        suggested_cta: reelPlan.suggested_cta,
        music_vibe: reelPlan.music_vibe
      }
    })
    .select()
    .single();

  if (editError) {
    return { success: false, error: editError.message };
  }

  // Execute edits
  const { data: executeResult, error: executeError } = await supabase.functions.invoke("ai-execute-edits", {
    body: {
      video_edit_id: editEntry.id,
      render_type: "full",
      organization_id: context.organization_id
    }
  });

  if (executeError) {
    return { success: false, error: executeError.message };
  }

  return {
    success: executeResult.success !== false,
    video_edit_id: editEntry.id,
    render_result: executeResult,
    download_url: executeResult.download_url
  };
}

/**
 * Execute story content creation
 */
async function executeStoryContent(
  supabase: any, 
  task: any, 
  context: TaskContext,
  assets: { videos: any[], images: any[] }
): Promise<any> {
  console.log("[execute-delegated-task] Executing story content...");
  
  // For stories, use images or short video clips
  const imageUrl = context.image_urls?.[0] || assets.images[0]?.file_url;
  const videoUrl = context.video_urls?.[0] || assets.videos[0]?.file_url;
  const contentUrl = imageUrl || videoUrl;
  
  if (!contentUrl) {
    return { success: false, error: "No image or video content for story" };
  }

  // Future: call ai-generate-story with platform awareness
  return {
    success: true,
    output_url: contentUrl,
    message: "Story content prepared"
  };
}

/**
 * Execute static ad creation
 */
async function executeStaticAd(
  supabase: any, 
  task: any, 
  context: TaskContext,
  assets: { videos: any[], images: any[] }
): Promise<any> {
  console.log("[execute-delegated-task] Executing static ad...");

  const imageUrl = context.image_urls?.[0] || assets.images[0]?.file_url;
  
  if (!imageUrl) {
    return { success: false, error: "No image content available for static ad" };
  }

  // Call the static ad generator
  const { data: adResult, error: adError } = await supabase.functions.invoke("ai-generate-static-ad", {
    body: {
      organization_id: context.organization_id,
      image_url: imageUrl,
      headline: task.title
    }
  });

  if (adError) {
    return { success: false, error: adError.message };
  }

  return adResult;
}
