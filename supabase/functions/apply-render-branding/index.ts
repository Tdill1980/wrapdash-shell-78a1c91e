// ============================================
// ApproveFlow OS — Render Branding Function
// ============================================
// PHASE 1: Additive function — does not modify existing pipeline
// 
// Purpose: Apply locked branding to any render image
// Branding: "WrapCommandAI™ for WPW" + "ApproveFlow™" (top-left)
//           "Order #XXXXX" (bottom-right)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OS CONSTANTS — LOCKED BRANDING
const BRAND_LINE_1 = "WrapCommandAI™ for WPW";
const BRAND_LINE_2 = "ApproveFlow™";

interface BrandingRequest {
  imageUrl: string;
  orderNumber: string;
  viewLabel?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, orderNumber, viewLabel } = await req.json() as BrandingRequest;
    
    console.log('[apply-render-branding] Request received:', {
      imageUrl: imageUrl?.substring(0, 50) + '...',
      orderNumber,
      viewLabel
    });

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }
    if (!orderNumber) {
      throw new Error('orderNumber is required');
    }

    // Get Lovable API key for AI image editing
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build the branding prompt for AI overlay
    const brandingPrompt = `
Add professional branding overlays to this vehicle render image. The overlays must be:

TOP-LEFT CORNER:
- Line 1: "${BRAND_LINE_1}" in black Inter font, small but legible (approximately 16-20px equivalent)
- Line 2: "${BRAND_LINE_2}" directly below, same styling but slightly smaller

BOTTOM-RIGHT CORNER:
- Text: "Order #${orderNumber}" in black Inter font, same size as top branding
${viewLabel ? `- Below that: "${viewLabel}" in slightly smaller text` : ''}

CRITICAL RULES:
- Branding must be subtle but clearly readable
- Use a very slight semi-transparent white background behind text for readability
- Do NOT modify the vehicle or wrap design in any way
- Do NOT change the studio environment
- Only add the text overlays exactly as specified
- Text should be crisp and professional
`.trim();

    console.log('[apply-render-branding] Calling AI for branding overlay...');

    // Call AI to apply branding
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: brandingPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[apply-render-branding] AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const brandedImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!brandedImageBase64) {
      console.error('[apply-render-branding] No image in AI response');
      // Return original image URL if branding fails (graceful degradation)
      return new Response(JSON.stringify({
        success: true,
        brandedUrl: imageUrl,
        warning: 'Branding could not be applied, returning original'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[apply-render-branding] Branding applied successfully');

    // Return the branded image (base64)
    return new Response(JSON.stringify({
      success: true,
      brandedUrl: brandedImageBase64,
      brandingApplied: {
        line1: BRAND_LINE_1,
        line2: BRAND_LINE_2,
        orderNumber: `Order #${orderNumber}`,
        viewLabel: viewLabel || null
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[apply-render-branding] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
