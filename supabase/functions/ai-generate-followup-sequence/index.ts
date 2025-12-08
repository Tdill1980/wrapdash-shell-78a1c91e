import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { loadTradeDNA, generateBrandVoicePrompt } from "../_shared/tradedna-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FollowupRequest {
  customerName: string;
  customerEmail: string;
  quoteNumber: string;
  vehicleInfo?: string;
  productName?: string;
  totalPrice?: number;
  tone?: 'installer' | 'luxury' | 'hype';
  organizationId?: string;
}

interface FollowupEmail {
  day: number;
  subject: string;
  previewText: string;
  bodyHtml: string;
  urgencyLevel: 'friendly' | 'helpful' | 'urgent' | 'final';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerName, 
      customerEmail,
      quoteNumber,
      vehicleInfo,
      productName,
      totalPrice,
      tone = 'installer',
      organizationId
    }: FollowupRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Load TradeDNA for brand voice
    const tradeDNA = await loadTradeDNA(organizationId);
    const brandVoicePrompt = generateBrandVoicePrompt(tradeDNA);

    const toneDescriptions = {
      installer: 'professional wrap installer - friendly, knowledgeable, focused on quality and craftsmanship',
      luxury: 'high-end luxury brand - refined, exclusive, premium experience focused',
      hype: 'energetic and bold - exciting, urgent, action-oriented with enthusiasm'
    };

    const systemPrompt = `You are an expert email copywriter for ${tradeDNA.business_name || 'a vehicle wrap business'}. Your tone is ${toneDescriptions[tone]}.

${brandVoicePrompt}

Generate a 4-email follow-up sequence for a customer who received a quote but hasn't responded. Each email should be unique with escalating urgency.

Generate a 4-email follow-up sequence for a customer who received a quote but hasn't responded. Each email should be unique with escalating urgency.

IMPORTANT RULES:
- Each email MUST be completely different - no repeated phrases or structures
- Day 1: Friendly check-in, "just making sure you got it"
- Day 3: Add value, offer to answer questions, share a relevant tip
- Day 7: Create urgency around scheduling/availability
- Day 14: Final chance, mention moving on but door stays open

Return ONLY valid JSON in this exact format:
{
  "emails": [
    {
      "day": 1,
      "subject": "subject line here",
      "previewText": "preview text here (max 100 chars)",
      "bodyHtml": "<p>HTML email body here</p>",
      "urgencyLevel": "friendly"
    },
    {
      "day": 3,
      "subject": "subject line here",
      "previewText": "preview text here",
      "bodyHtml": "<p>HTML email body here</p>",
      "urgencyLevel": "helpful"
    },
    {
      "day": 7,
      "subject": "subject line here",
      "previewText": "preview text here",
      "bodyHtml": "<p>HTML email body here</p>",
      "urgencyLevel": "urgent"
    },
    {
      "day": 14,
      "subject": "subject line here",
      "previewText": "preview text here",
      "bodyHtml": "<p>HTML email body here</p>",
      "urgencyLevel": "final"
    }
  ]
}`;

    const userPrompt = `Generate a 4-email follow-up sequence for:
- Customer: ${customerName}
- Email: ${customerEmail}
- Quote #: ${quoteNumber}
${vehicleInfo ? `- Vehicle: ${vehicleInfo}` : ''}
${productName ? `- Product: ${productName}` : ''}
${totalPrice ? `- Quote Total: $${totalPrice.toLocaleString()}` : ''}

Use merge tags like {{customer_name}}, {{quote_number}}, {{vehicle_info}}, {{total_price}} in the emails.`;

    console.log('Generating follow-up sequence for:', { customerName, quoteNumber, tone });

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    // Parse JSON from response
    let parsedContent;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    const emails: FollowupEmail[] = parsedContent.emails || [];

    console.log('Generated follow-up sequence:', emails.length, 'emails');

    return new Response(JSON.stringify({ 
      success: true,
      emails,
      metadata: {
        customerName,
        quoteNumber,
        tone,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-generate-followup-sequence:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
