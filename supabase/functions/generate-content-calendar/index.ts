import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default weekly content schedule
const WEEKLY_SCHEDULE = {
  monday: { brand: 'wraptv', type: 'reel', title: 'WrapTV Monday Reveal' },
  tuesday: { brand: 'wpw', type: 'static', title: 'Installer Tip Tuesday' },
  wednesday: { brand: 'wpw', type: 'reel', title: 'FadeWrap Wednesday' },
  thursday: { brand: 'inkandedge', type: 'reel', title: 'Cinematic Thursday' },
  friday: { brand: 'wpw', type: 'static', title: 'Affiliate Spotlight Friday' },
  saturday: { brand: 'wraptv', type: 'story', title: 'Shop Tour Saturday' },
  sunday: { brand: 'inkandedge', type: 'static', title: 'Sunday Showcase' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      organization_id,
      weeks_ahead = 2,
      custom_schedule
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const schedule = custom_schedule || WEEKLY_SCHEDULE;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const calendarEntries = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Generate entries for each day
    for (let week = 0; week < weeks_ahead; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const dayName = days[currentDate.getDay()];
        const daySchedule = schedule[dayName];
        
        if (!daySchedule) continue;

        // Check if entry already exists
        const dateStr = currentDate.toISOString().split('T')[0];
        const { data: existing } = await supabase
          .from('content_calendar')
          .select('id')
          .eq('scheduled_date', dateStr)
          .eq('brand', daySchedule.brand)
          .single();

        if (existing) continue;

        // Get a ready content project for this brand/type
        const { data: project } = await supabase
          .from('content_projects')
          .select('*')
          .eq('brand', daySchedule.brand)
          .eq('project_type', daySchedule.type)
          .eq('status', 'ready')
          .is('scheduled_for', null)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        // Create calendar entry
        const entry = {
          organization_id,
          content_project_id: project?.id,
          brand: daySchedule.brand,
          platform: 'instagram',
          scheduled_date: dateStr,
          scheduled_time: '12:00:00',
          content_type: daySchedule.type,
          title: daySchedule.title,
          caption: project?.ai_output?.captions?.medium || '',
          hashtags: project?.ai_output?.hashtags || [],
          status: project ? 'scheduled' : 'draft'
        };

        const { data: inserted, error } = await supabase
          .from('content_calendar')
          .insert(entry)
          .select()
          .single();

        if (error) {
          console.error('Error inserting calendar entry:', error);
        } else {
          calendarEntries.push(inserted);

          // Update project if assigned
          if (project) {
            await supabase
              .from('content_projects')
              .update({ 
                status: 'scheduled',
                scheduled_for: `${dateStr}T12:00:00Z`
              })
              .eq('id', project.id);
          }
        }
      }
    }

    console.log(`Generated ${calendarEntries.length} calendar entries`);

    return new Response(JSON.stringify({ 
      success: true,
      entries_created: calendarEntries.length,
      calendar: calendarEntries
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-content-calendar:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
