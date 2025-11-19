import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, orderId } = await req.json();
    
    console.log('Generating thumbnail for:', url, 'Order:', orderId);

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract file extension
    const fileName = url.split('/').pop() || 'file';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

    console.log('File type detected:', fileExt);

    // Download the original file
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }

    const fileBlob = await fileResponse.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();

    let thumbnailBlob: Blob;

    // Handle different file types
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      // For images, resize them
      console.log('Processing image file');
      thumbnailBlob = await generateImageThumbnail(arrayBuffer, fileExt);
    } else if (fileExt === 'pdf') {
      // For PDFs, create a placeholder thumbnail
      console.log('Processing PDF file');
      thumbnailBlob = await generatePlaceholderThumbnail('PDF', '#EF4444');
    } else if (fileExt === 'ai') {
      // For AI files, create a placeholder thumbnail
      console.log('Processing AI file');
      thumbnailBlob = await generatePlaceholderThumbnail('AI', '#FF6B35');
    } else {
      // For unknown files, create a generic placeholder
      console.log('Processing unknown file type');
      thumbnailBlob = await generatePlaceholderThumbnail('FILE', '#6B7280');
    }

    // Upload thumbnail to storage
    const thumbnailFileName = `thumbnails/${orderId}/${fileName}_thumb.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('approveflow-files')
      .upload(thumbnailFileName, thumbnailBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('approveflow-files')
      .getPublicUrl(thumbnailFileName);

    console.log('Thumbnail generated successfully:', publicUrl);

    return new Response(
      JSON.stringify({ thumbnailUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Generate a simple image thumbnail by resizing
async function generateImageThumbnail(arrayBuffer: ArrayBuffer, ext: string): Promise<Blob> {
  // For now, return the original image as-is
  // In production, you'd want to use an image processing library
  // to actually resize the image to thumbnail size
  const blob = new Blob([arrayBuffer], { type: `image/${ext}` });
  return blob;
}

// Generate a placeholder SVG thumbnail for non-image files
async function generatePlaceholderThumbnail(label: string, color: string): Promise<Blob> {
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${color}" opacity="0.2"/>
      <rect x="20" y="20" width="160" height="160" fill="${color}" opacity="0.4" rx="8"/>
      <text x="100" y="110" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
            fill="white" text-anchor="middle">${label}</text>
    </svg>
  `;
  
  return new Blob([svg], { type: 'image/svg+xml' });
}
