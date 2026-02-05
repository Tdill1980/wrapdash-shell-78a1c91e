import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, brand = 'wpw' } = await req.json();

    const INSTAGRAM_ACCESS_TOKEN = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!INSTAGRAM_ACCESS_TOKEN) {
      throw new Error('INSTAGRAM_ACCESS_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting Instagram media sync for brand:', brand);

    // Fetch media from Instagram Graph API
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=50`
    );

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.error('Instagram API error:', errorText);
      throw new Error(`Instagram API error: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();
    const mediaItems = mediaData.data || [];

    console.log(`Found ${mediaItems.length} media items from Instagram`);

    let synced = 0;
    let skipped = 0;

    for (const item of mediaItems) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('content_files')
        .select('id')
        .eq('source', 'instagram')
        .eq('source_id', item.id)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Determine file type
      let fileType = 'image';
      if (item.media_type === 'VIDEO') fileType = 'video';
      if (item.media_type === 'CAROUSEL_ALBUM') fileType = 'carousel';

      // Extract tags from caption
      const tags: string[] = [];
      if (item.caption) {
        const hashtagMatches = item.caption.match(/#\w+/g);
        if (hashtagMatches) {
          tags.push(...hashtagMatches.map((t: string) => t.slice(1).toLowerCase()));
        }
      }

      // Insert into content_files
      const { error: insertError } = await supabase
        .from('content_files')
        .insert({
          organization_id,
          source: 'instagram',
          source_id: item.id,
          brand,
          file_type: fileType,
          file_url: item.media_url || item.thumbnail_url,
          thumbnail_url: item.thumbnail_url,
          tags,
          metadata: {
            caption: item.caption,
            permalink: item.permalink,
            timestamp: item.timestamp,
            media_type: item.media_type
          },
          processing_status: fileType === 'video' ? 'pending' : 'completed'
        });

      if (insertError) {
        console.error('Error inserting media:', insertError);
      } else {
        synced++;

        // Queue for AI processing if video
        if (fileType === 'video') {
          const { data: newFile } = await supabase
            .from('content_files')
            .select('id')
            .eq('source_id', item.id)
            .single();

          if (newFile) {
            await supabase.from('content_generation_queue').insert({
              content_file_id: newFile.id,
              organization_id,
              brand,
              generation_type: 'full',
              priority: 5
            });
          }
        }
      }
    }

    // Update sync source record
    await supabase
      .from('content_sync_sources')
      .upsert({
        organization_id,
        source_type: 'instagram',
        last_sync_at: new Date().toISOString(),
        sync_status: 'active'
      }, {
        onConflict: 'organization_id,source_type'
      });

    console.log(`Sync complete: ${synced} new, ${skipped} skipped`);

    return new Response(JSON.stringify({ 
      success: true,
      synced,
      skipped,
      total: mediaItems.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-instagram-media:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
