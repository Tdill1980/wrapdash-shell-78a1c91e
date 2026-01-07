import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * StudioRenderOS - Locked 6-View Studio Rendering System
 * 
 * Generates deterministic, photorealistic studio renders from a 2D proof.
 * Each view has locked camera angles, lighting, and environment.
 * 
 * Views:
 * 1. driver_side - 45° front-left, eye-level
 * 2. front - centered, slight elevation
 * 3. rear - centered, slight elevation  
 * 4. passenger_side - 45° front-right, eye-level
 * 5. top - overhead/drone view
 * 6. detail - macro crop of key design element
 */

interface StudioRenderRequest {
  projectId: string;
  versionId: string;
  panelUrl: string;
  vehicle: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

// Locked studio environment - NEVER changes
const STUDIO_ENVIRONMENT = `
STUDIO ENVIRONMENT (LOCKED - DO NOT DEVIATE):
- Background: Seamless charcoal gray cyclorama studio
- Floor: Polished dark concrete with subtle reflections
- Lighting: Professional 3-point automotive photography setup
  - Key light: Large softbox front-left at 45°, soft warm white
  - Fill light: Diffused front-right, 50% intensity
  - Rim light: Behind vehicle, subtle edge highlight
- Shadows: Realistic contact shadows under tires and body
- No props, no scenery, no sky, no text overlays
- Clean, professional automotive studio aesthetic
`;

// Locked camera positions for each view
const VIEW_CONFIGS = {
  driver_side: {
    label: "Driver Side",
    camera: "45-degree front-left three-quarter view, eye-level height (4 feet from ground), camera 15 feet from vehicle center",
    focus: "Full vehicle visible, driver side prominently displayed, slight upward angle"
  },
  front: {
    label: "Front",
    camera: "Straight-on front view, slightly elevated (5 feet height), centered on vehicle grille, camera 12 feet from bumper",
    focus: "Symmetrical front view, hood and front fascia clearly visible"
  },
  rear: {
    label: "Rear", 
    camera: "Straight-on rear view, slightly elevated (5 feet height), centered on tailgate/trunk, camera 12 feet from bumper",
    focus: "Symmetrical rear view, tailgate and rear fascia clearly visible"
  },
  passenger_side: {
    label: "Passenger Side",
    camera: "45-degree front-right three-quarter view, eye-level height (4 feet from ground), camera 15 feet from vehicle center",
    focus: "Full vehicle visible, passenger side prominently displayed, slight upward angle"
  },
  top: {
    label: "Top",
    camera: "Overhead drone-style view, camera directly above vehicle at 20 feet height, looking straight down",
    focus: "Full roof and hood visible, vehicle centered in frame, slight forward angle showing hood"
  },
  detail: {
    label: "Detail",
    camera: "Close-up macro shot of the most prominent design element (logo, main graphic, or key branding), camera 3 feet away",
    focus: "Sharp focus on the main design element, shallow depth of field, professional product photography"
  }
};

async function generateSingleView(
  apiKey: string,
  vehicle: string,
  panelUrl: string,
  viewKey: string,
  viewConfig: typeof VIEW_CONFIGS.driver_side
): Promise<string | null> {
  const prompt = `You are an expert automotive visualization artist creating a PHOTOREALISTIC studio render.

TASK: Generate a professional 3D render of a ${vehicle} with the provided wrap design applied.

VIEW: ${viewConfig.label}
CAMERA: ${viewConfig.camera}
FOCUS: ${viewConfig.focus}

${STUDIO_ENVIRONMENT}

WRAP APPLICATION RULES (CRITICAL):
✓ Apply the 2D panel artwork as a PROFESSIONALLY INSTALLED vehicle wrap
✓ Wrap follows all vehicle body contours naturally - doors, fenders, panels, curves
✓ Design maintains proportions - no stretching, no distortion, no tiling artifacts
✓ Seamless application across panel gaps and body lines
✓ Show realistic vinyl wrap material properties - appropriate for the finish
✓ No bubbles, no wrinkles, no imperfections - professional installation quality

PHOTOREALISM REQUIREMENTS (NON-NEGOTIABLE):
✓ Real-world accurate vehicle proportions and body shape for ${vehicle}
✓ Physically accurate lighting and shadows
✓ Realistic material reflections and surface properties
✓ Professional automotive photography quality
✓ No cartoon style, no CGI artifacts, no uncanny valley
✓ The render should be indistinguishable from a real photograph

OUTPUT: Single photorealistic image, no text, no labels, no watermarks.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: panelUrl } }
            ]
          }
        ],
        modalities: ["image"]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`View ${viewKey} failed:`, response.status, error);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  } catch (error) {
    console.error(`Error generating ${viewKey}:`, error);
    return null;
  }
}

async function uploadBase64ToStorage(
  supabase: any,
  projectId: string,
  versionId: string,
  viewKey: string,
  base64Data: string
): Promise<string | null> {
  try {
    // Extract the actual base64 content
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    const filePath = `${projectId}/studio-renders/${versionId}_${viewKey}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('approveflow-files')
      .upload(filePath, binaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error(`Upload error for ${viewKey}:`, uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('approveflow-files')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error(`Storage error for ${viewKey}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, versionId, panelUrl, vehicle, vehicleYear, vehicleMake, vehicleModel } = 
      await req.json() as StudioRenderRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase credentials");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build vehicle description
    const vehicleDesc = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ') || vehicle;
    
    console.log(`[StudioRenderOS] Starting 6-view generation for: ${vehicleDesc}`);
    console.log(`[StudioRenderOS] Project: ${projectId}, Version: ${versionId}`);

    // Generate all 6 views in parallel (but staggered to avoid rate limits)
    const viewKeys = Object.keys(VIEW_CONFIGS) as (keyof typeof VIEW_CONFIGS)[];
    const renderUrls: Record<string, string> = {};
    const errors: string[] = [];

    // Process views in batches of 2 to avoid rate limiting
    for (let i = 0; i < viewKeys.length; i += 2) {
      const batch = viewKeys.slice(i, i + 2);
      
      const batchPromises = batch.map(async (viewKey) => {
        console.log(`[StudioRenderOS] Generating: ${viewKey}`);
        
        const base64Image = await generateSingleView(
          LOVABLE_API_KEY,
          vehicleDesc,
          panelUrl,
          viewKey,
          VIEW_CONFIGS[viewKey]
        );

        if (base64Image) {
          const publicUrl = await uploadBase64ToStorage(
            supabase,
            projectId,
            versionId,
            viewKey,
            base64Image
          );

          if (publicUrl) {
            renderUrls[viewKey] = publicUrl;
            console.log(`[StudioRenderOS] ✓ ${viewKey} complete`);
          } else {
            errors.push(`Failed to upload ${viewKey}`);
          }
        } else {
          errors.push(`Failed to generate ${viewKey}`);
        }
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + 2 < viewKeys.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Save to approveflow_3d table
    const { error: dbError } = await supabase
      .from('approveflow_3d')
      .upsert({
        project_id: projectId,
        version_id: versionId,
        render_urls: renderUrls,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,version_id'
      });

    if (dbError) {
      console.error('[StudioRenderOS] DB save error:', dbError);
    }

    const successCount = Object.keys(renderUrls).length;
    console.log(`[StudioRenderOS] Complete: ${successCount}/6 views generated`);

    return new Response(JSON.stringify({ 
      success: true,
      renderUrls,
      generatedViews: successCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[StudioRenderOS] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
