import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_GOAL = 10000; // $10k daily target

// Content task templates for when behind goal
const CONTENT_TASKS = [
  {
    task_type: "instagram_story",
    title: "📸 Post Instagram Story - Flash Promotion",
    description: "Create urgency-driven IG story highlighting current deals. Use countdown sticker, swipe-up CTA.",
    priority: "high",
    agent: "Casey Ramirez",
  },
  {
    task_type: "email_campaign",
    title: "✉️ Send Recovery Email - Limited Time Offer",
    description: "Email blast to past customers with exclusive same-day pricing. Focus on urgency and scarcity.",
    priority: "high",
    agent: "Alex Morgan",
  },
  {
    task_type: "sms_blast",
    title: "📱 SMS Blast - Today Only Deal",
    description: "Text campaign to hot leads and past customers. Short, punchy message with direct booking link.",
    priority: "medium",
    agent: "Jordan Lee",
  },
  {
    task_type: "reel_video",
    title: "🎬 Quick Reel - Project Showcase",
    description: "30-second before/after reel of recent project. Add trending audio, strong hook in first 2 seconds.",
    priority: "medium",
    agent: "Noah Bennett",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { organization_id } = await req.json().catch(() => ({}));

    console.log("[sales-goal-autopilot] Starting check...");

    // First, fetch current sales data
    const wooUrl = Deno.env.get("VITE_WOO_URL") || "https://weprintwraps.com";
    const consumerKey = Deno.env.get("WOO_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("WOO_CONSUMER_SECRET");

    if (!consumerKey || !consumerSecret) {
      throw new Error("WooCommerce credentials not configured");
    }

    // Get today's date range in store timezone
    const STORE_TIMEZONE = Deno.env.get("STORE_TIMEZONE") || "America/Phoenix";
    const now = new Date();
    
    // Calculate today's start in store timezone
    const todayStr = new Intl.DateTimeFormat("en-US", {
      timeZone: STORE_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    
    const [month, day, year] = todayStr.split("/").map(Number);
    const todayStart = new Date(Date.UTC(year, month - 1, day, 7, 0, 0)); // 7am UTC = midnight Arizona
    const todayEnd = now;

    // Fetch today's orders
    const ordersUrl = `${wooUrl}/wp-json/wc/v3/orders?after=${todayStart.toISOString()}&before=${todayEnd.toISOString()}&per_page=100&status=completed,processing&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    
    const response = await fetch(ordersUrl);
    if (!response.ok) {
      console.error("[sales-goal-autopilot] WooCommerce error:", response.status);
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const orders = await response.json();
    const todayRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total || 0), 0);
    const deficit = DAILY_GOAL - todayRevenue;
    const percentOfGoal = (todayRevenue / DAILY_GOAL) * 100;

    console.log(`[sales-goal-autopilot] Today: $${todayRevenue.toFixed(2)} / $${DAILY_GOAL} (${percentOfGoal.toFixed(1)}%)`);

    // If on track or ahead, no tasks needed
    if (todayRevenue >= DAILY_GOAL * 0.8) {
      console.log("[sales-goal-autopilot] Sales on track, no action needed");
      return new Response(
        JSON.stringify({
          status: "on_track",
          todayRevenue,
          dailyGoal: DAILY_GOAL,
          percentOfGoal,
          tasksCreated: 0,
          message: "Sales are on track - no additional content needed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we already created tasks today
    const todayIso = todayStart.toISOString().split("T")[0];
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("id, task_type")
      .eq("due_date", todayIso)
      .eq("status", "pending_review");

    const existingTaskTypes = new Set((existingTasks || []).map((t: any) => t.task_type));

    // Determine how many tasks to create based on deficit severity
    type ContentTask = typeof CONTENT_TASKS[number];
    let tasksToCreate: ContentTask[] = [];
    if (deficit > DAILY_GOAL * 0.5) {
      // More than 50% behind - create all 4 tasks
      tasksToCreate = CONTENT_TASKS.filter((t) => !existingTaskTypes.has(t.task_type));
    } else if (deficit > DAILY_GOAL * 0.3) {
      // 30-50% behind - create 2 high priority tasks
      tasksToCreate = CONTENT_TASKS.filter((t) => t.priority === "high" && !existingTaskTypes.has(t.task_type));
    } else {
      // 20-30% behind - create 1 story task
      const storyTask = CONTENT_TASKS.find((t) => t.task_type === "instagram_story");
      if (storyTask && !existingTaskTypes.has("instagram_story")) {
        tasksToCreate = [storyTask];
      }
    }

    if (tasksToCreate.length === 0) {
      console.log("[sales-goal-autopilot] Tasks already exist for today");
      return new Response(
        JSON.stringify({
          status: "tasks_exist",
          todayRevenue,
          dailyGoal: DAILY_GOAL,
          percentOfGoal,
          tasksCreated: 0,
          message: "Content tasks already queued for today",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the tasks
    const tasksToInsert = tasksToCreate.map((task) => ({
      title: task.title,
      description: `${task.description}\n\n🎯 Sales Recovery Task\nToday's revenue: $${todayRevenue.toLocaleString()}\nDeficit: $${deficit.toLocaleString()}\nAssigned to: ${task.agent}`,
      status: "pending_review",
      priority: task.priority,
      due_date: todayIso,
      task_type: task.task_type,
      organization_id: organization_id || null,
    }));

    const { data: createdTasks, error: insertError } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error("[sales-goal-autopilot] Failed to create tasks:", insertError);
      throw insertError;
    }

    console.log(`[sales-goal-autopilot] Created ${createdTasks?.length || 0} tasks`);

    // Also create an ai_action record for tracking
    await supabase.from("ai_actions").insert({
      action_type: "sales_recovery_content",
      action_payload: {
        todayRevenue,
        dailyGoal: DAILY_GOAL,
        deficit,
        tasksCreated: tasksToCreate.map((t) => t.task_type),
      },
      organization_id: organization_id || null,
      priority: deficit > DAILY_GOAL * 0.5 ? "high" : "medium",
    });

    return new Response(
      JSON.stringify({
        status: "tasks_created",
        todayRevenue,
        dailyGoal: DAILY_GOAL,
        percentOfGoal,
        deficit,
        tasksCreated: createdTasks?.length || 0,
        tasks: tasksToCreate.map((t) => ({ type: t.task_type, title: t.title, agent: t.agent })),
        message: `Created ${createdTasks?.length || 0} content tasks to boost sales`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[sales-goal-autopilot] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
