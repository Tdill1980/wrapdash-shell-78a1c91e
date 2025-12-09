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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      partner_handle, 
      media_url, 
      media_type, 
      caption,
      brand = 'wpw',
      source = 'manual',
      tags = []
    } = await req.json();

    console.log('Ingesting content for partner:', partner_handle, 'brand:', brand);

    // Check if content already exists
    const { data: existing } = await supabase
      .from("content_files")
      .select("id")
      .eq("file_url", media_url)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Content already exists',
        id: existing.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert into content_files
    const { data: contentFile, error: insertError } = await supabase
      .from("content_files")
      .insert({
        file_url: media_url,
        file_type: media_type || 'image',
        brand,
        source,
        tags,
        metadata: { caption, partner_handle },
        processing_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Queue for AI analysis
    await supabase.from("content_generation_queue").insert({
      content_file_id: contentFile.id,
      brand,
      generation_type: 'analysis',
      status: 'pending',
      priority: 1
    });

    console.log('Content ingested:', contentFile.id);

    return new Response(JSON.stringify({ 
      success: true, 
      id: contentFile.id,
      queued_for_analysis: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content-ingest:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
