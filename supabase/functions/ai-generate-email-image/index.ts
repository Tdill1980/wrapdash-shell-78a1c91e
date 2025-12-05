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
    const { description, size = 'header', style = 'modern' } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Image description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Size configurations
    const sizes: Record<string, { width: number; height: number }> = {
      header: { width: 600, height: 200 },
      hero: { width: 600, height: 400 },
      square: { width: 512, height: 512 },
      banner: { width: 600, height: 150 }
    };

    const sizeConfig = sizes[size] || sizes.header;

    // Style descriptions
    const styleDescriptions: Record<string, string> = {
      modern: 'Clean, minimalist, modern design with subtle gradients and professional look',
      luxury: 'Premium, elegant, sophisticated with gold accents and rich colors',
      bold: 'Vibrant colors, dynamic shapes, eye-catching and energetic',
      minimal: 'Very simple, clean lines, lots of white space, understated elegance',
      automotive: 'Vehicle-focused, sleek, showcasing cars and wraps professionally'
    };

    const styleGuide = styleDescriptions[style] || styleDescriptions.modern;

    const imagePrompt = `Professional email ${size} image for a vehicle wrap business. 
${description}
Style: ${styleGuide}
Aspect ratio: ${sizeConfig.width}:${sizeConfig.height}
Ultra high quality, suitable for email marketing.
No text or logos - clean imagery only.`;

    console.log('Generating image:', imagePrompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: imagePrompt }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Image API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Image API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Image generated, uploading to storage...');

    // Upload to Supabase storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to blob
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `email-images/${Date.now()}-${size}-${style}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('approveflow-files')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Return base64 as fallback
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl,
          isBase64: true,
          message: 'Image generated (base64)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('approveflow-files')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        isBase64: false,
        width: sizeConfig.width,
        height: sizeConfig.height,
        message: 'Image generated and uploaded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
