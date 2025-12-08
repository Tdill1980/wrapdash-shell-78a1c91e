import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { loadTradeDNA, generateBrandVoicePrompt } from "../_shared/tradedna-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentHtml, improvementType = 'more_compelling', tone = 'installer', organizationId } = await req.json();

    if (!currentHtml) {
      return new Response(
        JSON.stringify({ error: 'Current HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Load TradeDNA for brand voice
    const tradeDNA = await loadTradeDNA(organizationId);
    const brandVoicePrompt = generateBrandVoicePrompt(tradeDNA);

    const toneDescriptions: Record<string, string> = {
      installer: 'Professional, technical, straightforward. Like talking shop with another installer.',
      luxury: 'Elegant, sophisticated, premium feel. Emphasizes quality and exclusivity.',
      hype: 'Bold, exciting, energetic! Uses action words and creates urgency.'
    };

    const improvementInstructions: Record<string, string> = {
      more_compelling: 'Make it more compelling and persuasive. Add stronger value propositions and benefits.',
      shorter: 'Make it shorter and more concise. Remove fluff while keeping the key message.',
      more_professional: 'Make it more professional and polished. Improve grammar and tone.',
      add_urgency: 'Add urgency and scarcity. Include time-sensitive language and limited availability.',
      friendlier: 'Make it warmer and more personable. Add conversational elements.',
      clearer_cta: 'Improve the call-to-action. Make it clearer what the reader should do next.'
    };

    const systemPrompt = `You are an expert email copywriter for ${tradeDNA.business_name || 'a vehicle wrap business'}. 
Your job is to improve email content while maintaining the HTML structure.

${brandVoicePrompt}

TONE: ${toneDescriptions[tone] || toneDescriptions.installer}

IMPROVEMENT TYPE: ${improvementInstructions[improvementType] || improvementInstructions.more_compelling}

Rules:
1. Keep all merge tags intact ({{customer_name}}, {{vehicle_make}}, etc.)
2. Maintain the HTML structure (keep all tags, classes, styles)
3. Only improve the text content
4. Keep images and buttons in place
5. Return the improved HTML only, no explanation`;

    const userPrompt = `Improve this email HTML content:

${currentHtml}

Return ONLY the improved HTML, maintaining all structure and merge tags.`;

    console.log('Improving email content, type:', improvementType);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
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
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let improvedHtml = data.choices?.[0]?.message?.content;

    if (!improvedHtml) {
      throw new Error('No content received from AI');
    }

    // Clean up any markdown formatting
    improvedHtml = improvedHtml
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('Content improved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        improvedHtml,
        message: 'Content improved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error improving content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to improve content';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
