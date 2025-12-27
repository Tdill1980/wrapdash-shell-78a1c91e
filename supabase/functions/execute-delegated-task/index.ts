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
 * Flow:
 * 1. Fetch task from database
 * 2. Parse task type from title/description/content_type
 * 3. Gather context (video URLs, ContentBox assets, etc.)
 * 4. Route to appropriate executor:
 *    - Reels/Videos → ai-auto-create-reel → ai-execute-edits → mux-stitch-reel
 *    - Static ads → ai-generate-static-ad
 *    - Content publishing → publish-content
 * 5. Update task status: pending → in_progress → completed/failed
 * 6. Store output URL in task metadata
 */

interface TaskContext {
  video_urls?: string[];
  image_urls?: string[];
  content_type?: string;
  dara_format?: string;
  organization_id?: string;
  mightytask_id?: string;
  chat_context?: Record<string, unknown>;
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

    // Step 3: Parse task type and gather context
    const taskContext = parseTaskContext(task, providedContext || {});
    console.log("[execute-delegated-task] Parsed context:", JSON.stringify(taskContext));

    // Step 4: Determine execution path based on content type
    const contentType = taskContext.content_type || inferContentType(task.title, task.description);
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
        executionResult = await executeVideoContent(supabase, task, taskContext);
        outputUrl = executionResult?.download_url || executionResult?.render_result?.download_url;
        break;

      case "ig_story":
      case "fb_story":
      case "story":
        executionResult = await executeStoryContent(supabase, task, taskContext);
        outputUrl = executionResult?.output_url;
        break;

      case "meta_ad":
      case "static_ad":
      case "ad":
        executionResult = await executeStaticAd(supabase, task, taskContext);
        outputUrl = executionResult?.output_url;
        break;

      default:
        console.log("[execute-delegated-task] Unknown content type, attempting video execution");
        executionResult = await executeVideoContent(supabase, task, taskContext);
        outputUrl = executionResult?.download_url || executionResult?.render_result?.download_url;
    }

    // Step 5: Update task with results
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

    // Step 6: If there's a content draft or output, create/update it
    if (isSuccess && outputUrl && taskContext.organization_id) {
      await supabase
        .from("content_drafts")
        .insert({
          organization_id: taskContext.organization_id,
          task_id: task_id,
          content_type: contentType,
          platform: contentType.startsWith("ig_") ? "instagram" : 
                    contentType.startsWith("fb_") ? "facebook" :
                    contentType.startsWith("youtube_") ? "youtube" : "instagram",
          media_url: outputUrl,
          status: "pending_review",
          caption: task.title,
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
        execution_result: executionResult
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
 * Parse task context from task data and provided context
 */
function parseTaskContext(task: any, providedContext: Record<string, unknown>): TaskContext {
  const context: TaskContext = {
    organization_id: task.organization_id,
    content_type: task.content_type,
  };

  // Extract video/image URLs from provided context
  if (providedContext.video_urls) {
    context.video_urls = providedContext.video_urls as string[];
  }
  if (providedContext.image_urls) {
    context.image_urls = providedContext.image_urls as string[];
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
 * Infer content type from task title/description
 */
function inferContentType(title: string, description: string | null): string {
  const text = `${title} ${description || ""}`.toLowerCase();

  if (text.includes("reel") || text.includes("video")) return "reel";
  if (text.includes("story")) return "story";
  if (text.includes("ad") || text.includes("advertisement")) return "meta_ad";
  if (text.includes("static")) return "static_ad";
  if (text.includes("post") || text.includes("content")) return "reel";

  // Default to reel
  return "reel";
}

/**
 * Execute video/reel content creation
 */
async function executeVideoContent(
  supabase: any, 
  task: any, 
  context: TaskContext
): Promise<any> {
  console.log("[execute-delegated-task] Executing video content...");

  // If we have a video URL, use single video mode
  const videoUrl = context.video_urls?.[0];

  if (videoUrl) {
    console.log("[execute-delegated-task] Single video mode with URL:", videoUrl);
    
    // Step 1: Call ai-auto-create-reel to analyze video and get scene cuts
    const { data: reelPlan, error: reelError } = await supabase.functions.invoke("ai-auto-create-reel", {
      body: {
        organization_id: context.organization_id,
        video_url: videoUrl,
        video_duration: 60, // Will be determined by AI
        dara_format: context.dara_format || "ugc_warehouse"
      }
    });

    if (reelError) {
      console.error("[execute-delegated-task] ai-auto-create-reel error:", reelError);
      return { success: false, error: reelError.message };
    }

    console.log("[execute-delegated-task] Reel plan created:", JSON.stringify(reelPlan));

    // Step 2: Create video_edit_queue entry
    const { data: editEntry, error: editError } = await supabase
      .from("video_edit_queue")
      .insert({
        organization_id: context.organization_id,
        source_url: videoUrl,
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
      console.error("[execute-delegated-task] Failed to create edit entry:", editError);
      return { success: false, error: editError.message };
    }

    console.log("[execute-delegated-task] Video edit entry created:", editEntry.id);

    // Step 3: Execute the edits
    const { data: executeResult, error: executeError } = await supabase.functions.invoke("ai-execute-edits", {
      body: {
        video_edit_id: editEntry.id,
        render_type: "full",
        organization_id: context.organization_id
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
      download_url: executeResult.download_url
    };
  }

  // No video URL provided - try to find from ContentBox
  console.log("[execute-delegated-task] No video URL, searching ContentBox...");
  
  const { data: contentFiles } = await supabase
    .from("content_files")
    .select("id, file_url, file_type, original_filename")
    .eq("organization_id", context.organization_id)
    .eq("file_type", "video")
    .order("created_at", { ascending: false })
    .limit(5);

  if (contentFiles && contentFiles.length > 0) {
    console.log("[execute-delegated-task] Found content files:", contentFiles.length);
    
    // Use the most recent video
    const videoFile = contentFiles[0];
    
    // Recursively call with the found video URL
    return executeVideoContent(supabase, task, {
      ...context,
      video_urls: [videoFile.file_url]
    });
  }

  return { success: false, error: "No video content available for this task" };
}

/**
 * Execute story content creation
 */
async function executeStoryContent(
  supabase: any, 
  task: any, 
  context: TaskContext
): Promise<any> {
  console.log("[execute-delegated-task] Executing story content...");
  
  // For stories, we typically use static images or short video clips
  const imageUrl = context.image_urls?.[0] || context.video_urls?.[0];
  
  if (!imageUrl) {
    return { success: false, error: "No image or video content for story" };
  }

  // For now, return success with the image URL as output
  // Future: call ai-generate-story or similar
  return {
    success: true,
    output_url: imageUrl,
    message: "Story content prepared"
  };
}

/**
 * Execute static ad creation
 */
async function executeStaticAd(
  supabase: any, 
  task: any, 
  context: TaskContext
): Promise<any> {
  console.log("[execute-delegated-task] Executing static ad...");

  const imageUrl = context.image_urls?.[0];
  
  if (!imageUrl) {
    // Try to find an image from ContentBox
    const { data: contentFiles } = await supabase
      .from("content_files")
      .select("id, file_url")
      .eq("organization_id", context.organization_id)
      .eq("file_type", "image")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!contentFiles || contentFiles.length === 0) {
      return { success: false, error: "No image content available for static ad" };
    }

    const foundImageUrl = contentFiles[0].file_url;

    // Call the static ad generator
    const { data: adResult, error: adError } = await supabase.functions.invoke("ai-generate-static-ad", {
      body: {
        organization_id: context.organization_id,
        image_url: foundImageUrl,
        headline: task.title
      }
    });

    if (adError) {
      return { success: false, error: adError.message };
    }

    return adResult;
  }

  // Call static ad generator with provided image
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
