import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agent = url.searchParams.get("agent");

    console.log(`[check-agent-status] Checking status for agent: ${agent}`);

    if (!agent) {
      console.log('[check-agent-status] No agent specified');
      return new Response(
        JSON.stringify({ active: false, reason: "Missing agent parameter" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("agent_schedules")
      .select("*")
      .eq("agent_name", agent)
      .single();

    if (error || !data) {
      console.log(`[check-agent-status] Agent not configured: ${agent}`, error);
      return new Response(
        JSON.stringify({ active: false, reason: "Agent not configured" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[check-agent-status] Found config:`, data);

    // Check emergency off first
    if (data.emergency_off) {
      console.log('[check-agent-status] Emergency shutdown active');
      return new Response(
        JSON.stringify({ active: false, reason: "Emergency shutdown active" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if agent is enabled
    if (!data.enabled) {
      console.log('[check-agent-status] Agent disabled');
      return new Response(
        JSON.stringify({ active: false, reason: "Agent disabled by admin" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check force_on - overrides schedule to turn ON
    if (data.force_on) {
      console.log('[check-agent-status] Force Start is active');
      return new Response(
        JSON.stringify({ active: true, reason: "Force Start active (ignoring schedule)" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current time in agent's timezone
    const timezone = data.timezone || 'America/Phoenix';
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    // Format as HH:MM for comparison
    const hours = localTime.getHours().toString().padStart(2, '0');
    const minutes = localTime.getMinutes().toString().padStart(2, '0');
    const nowTime = `${hours}:${minutes}`;
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = localTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    console.log(`[check-agent-status] Current time in ${timezone}: ${nowTime}, isWeekend: ${isWeekend}`);

    // Check weekend settings
    if (isWeekend && !data.active_weekends) {
      console.log('[check-agent-status] Inactive on weekends');
      return new Response(
        JSON.stringify({ active: false, reason: "Inactive on weekends" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no schedule set, default to active
    if (!data.active_after || !data.active_before) {
      console.log('[check-agent-status] No schedule set, defaulting to active');
      return new Response(
        JSON.stringify({ active: true, reason: "No schedule restrictions" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse schedule times (stored as TIME, comes as "HH:MM:SS")
    const activeAfter = data.active_after.slice(0, 5); // "17:00"
    const activeBefore = data.active_before.slice(0, 5); // "08:30"

    console.log(`[check-agent-status] Schedule: active ${activeAfter} to ${activeBefore}`);

    let inSchedule = false;

    // Handle overnight window (e.g., 17:00 → 08:30)
    // This means Jordan is ON from 5PM to 8:30AM next day
    if (activeAfter > activeBefore) {
      // Overnight schedule: ON if current time >= activeAfter OR current time <= activeBefore
      inSchedule = nowTime >= activeAfter || nowTime <= activeBefore;
    } else {
      // Same-day schedule: ON if current time is between activeAfter and activeBefore
      inSchedule = nowTime >= activeAfter && nowTime <= activeBefore;
    }

    console.log(`[check-agent-status] In schedule: ${inSchedule}`);

    if (!inSchedule) {
      return new Response(
        JSON.stringify({ 
          active: false, 
          reason: `Outside scheduled hours (${activeAfter} - ${activeBefore} ${timezone})`,
          currentTime: nowTime,
          timezone
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        active: true, 
        reason: "Within scheduled hours",
        currentTime: nowTime,
        timezone
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    // FAIL SAFE: If anything goes wrong, default to OFF
    console.error('[check-agent-status] Error:', err);
    return new Response(
      JSON.stringify({ active: false, reason: "Status check failed - fail safe" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
