import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HARD_CAP = 25;
const THROTTLE_MS = 750;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user's auth to check permissions
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin via user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle();

    if (roleError) {
      console.error('Role check error:', roleError);
    }

    // Also check organization membership for owner role
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    if (orgError) {
      console.error('Org membership check error:', orgError);
    }

    const isAdmin = roleData?.role === 'admin' || roleData?.role === 'owner' || 
                    orgMember?.role === 'owner' || orgMember?.role === 'admin';

    if (!isAdmin) {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'ADMIN_ONLY' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const requestedLimit = body.limit || 25;
    const limit = Math.min(requestedLimit, HARD_CAP);

    console.log(`Backfill starting: limit=${limit}, user=${user.id}`);

    // Query unanalyzed videos with mux_playback_id
    const { data: videos, error: queryError } = await supabase
      .from("content_files")
      .select("id, mux_playback_id, visual_analyzed_at")
      .eq("file_type", "video")
      .is("visual_analyzed_at", null)
      .not("mux_playback_id", "is", null)
      .limit(limit);

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'QUERY_FAILED', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!videos || videos.length === 0) {
      console.log('No unanalyzed videos found');
      return new Response(
        JSON.stringify({ processed: 0, skipped: 0, failed: 0, message: 'No unanalyzed videos found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${videos.length} unanalyzed videos`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    // Process each video with throttling
    for (const video of videos) {
      // Double-check not already analyzed (race condition protection)
      if (video.visual_analyzed_at) {
        console.log(`Skipping already analyzed: ${video.id}`);
        skipped++;
        continue;
      }

      if (!video.mux_playback_id) {
        console.log(`Skipping no playback ID: ${video.id}`);
        skipped++;
        continue;
      }

      try {
        console.log(`Analyzing video: ${video.id}`);

        // Call ai-analyze-video-frame
        const { data: analyzeResult, error: analyzeError } = await supabase.functions.invoke(
          'ai-analyze-video-frame',
          {
            body: { 
              video_id: video.id,
              mux_playback_id: video.mux_playback_id
            }
          }
        );

        if (analyzeError) {
          console.error(`Analyze error for ${video.id}:`, analyzeError);
          failed++;
        } else if (analyzeResult?.error) {
          console.error(`Analyze failed for ${video.id}:`, analyzeResult.error);
          failed++;
        } else {
          console.log(`Successfully analyzed: ${video.id}`);
          processed++;
        }

      } catch (err) {
        console.error(`Exception analyzing ${video.id}:`, err);
        failed++;
      }

      // Throttle: wait 750ms before next video
      if (videos.indexOf(video) < videos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, THROTTLE_MS));
      }
    }

    const result = { processed, skipped, failed };
    console.log('Backfill complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
