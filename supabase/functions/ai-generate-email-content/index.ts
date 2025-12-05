import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailGenerationRequest {
  customerName: string;
  customerEmail?: string;
  companyName?: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
  product?: string;
  price?: number;
  sqft?: number;
  tone: 'installer' | 'luxury' | 'hype';
  emailType: 'quote_initial' | 'quote_followup' | 'proof_ready' | 'order_confirmation' | 'shipping_notification' | 'custom';
  customPrompt?: string;
  previousEmails?: number; // Number of previous follow-ups sent
}

interface EmailGenerationResponse {
  subjectVariants: string[];
  bodyHtml: string;
  ctaText: string;
  previewText: string;
}

const toneInstructions = {
  installer: `
    Write in a friendly, professional installer voice. Use conversational language that's approachable but knowledgeable.
    - Use "Hey" or "Hi" instead of "Dear"
    - Keep sentences short and punchy
    - Include technical credibility without being overwhelming
    - Sound like a trusted shop owner talking to a customer
  `,
  luxury: `
    Write in an elegant, premium voice befitting high-end automotive customization.
    - Use sophisticated vocabulary without being pretentious
    - Emphasize exclusivity, craftsmanship, and attention to detail
    - Create a sense of premium experience
    - Sound like a luxury concierge service
  `,
  hype: `
    Write in an energetic, exciting voice that creates urgency and excitement.
    - Use bold, action-oriented language
    - Create FOMO and excitement
    - Include power words and enthusiasm
    - Sound like you're sharing something amazing
  `
};

const emailTypePrompts = {
  quote_initial: `Generate an initial quote email. The customer just requested a quote and this is our first response. Be welcoming, professional, and make them excited about the project.`,
  
  quote_followup: `Generate a follow-up email for a quote that hasn't been responded to. Be helpful, not pushy. Create urgency without being aggressive. Offer to answer questions.`,
  
  proof_ready: `Generate an email announcing that design proofs are ready for review. Build excitement about seeing their design come to life. Include clear instructions to view and approve.`,
  
  order_confirmation: `Generate an order confirmation email. Thank them for their order, confirm details, and set expectations for next steps. Make them feel confident in their purchase.`,
  
  shipping_notification: `Generate a shipping notification email. Build excitement that their order is on its way. Include tracking information placeholder and estimated delivery.`,
  
  custom: `Generate a custom email based on the specific prompt provided.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const request: EmailGenerationRequest = await req.json();
    const { 
      customerName, 
      customerEmail,
      companyName,
      vehicle, 
      product, 
      price, 
      sqft,
      tone, 
      emailType,
      customPrompt,
      previousEmails = 0
    } = request;

    // Build context string
    const vehicleStr = vehicle ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'their vehicle';
    const priceStr = price ? `$${price.toLocaleString()}` : '';
    const productStr = product || 'wrap service';

    const systemPrompt = `You are an expert email copywriter for a premium vehicle wrap and automotive customization business called WePrintWraps.

${toneInstructions[tone]}

IMPORTANT RULES:
- Never use generic phrases like "I hope this email finds you well"
- Always personalize with the customer's name
- Keep emails concise - max 150 words for body
- Include one clear call-to-action
- Use merge tags for dynamic content: {{customer_name}}, {{vehicle_info}}, {{quote_amount}}, {{product_name}}, {{company_name}}
- Generate 3 different subject line variants for A/B testing
- Make preview text compelling (max 90 characters)

Respond in JSON format only:
{
  "subjectVariants": ["subject1", "subject2", "subject3"],
  "bodyHtml": "<p>Email body with HTML formatting</p>",
  "ctaText": "Button text",
  "previewText": "Email preview text"
}`;

    let userPrompt = emailTypePrompts[emailType];
    
    if (emailType === 'custom' && customPrompt) {
      userPrompt = customPrompt;
    }

    // Add context
    userPrompt += `

CUSTOMER CONTEXT:
- Name: ${customerName}
- Email: ${customerEmail || 'Not provided'}
- Company: ${companyName || 'N/A'}
- Vehicle: ${vehicleStr}
- Product: ${productStr}
- Quote Amount: ${priceStr || 'Not specified'}
- Square Footage: ${sqft || 'Not specified'}
${previousEmails > 0 ? `- Previous follow-ups sent: ${previousEmails} (make this email different from previous ones)` : ''}

Generate the email content now.`;

    console.log('Generating email content with Lovable AI...');
    console.log('Email type:', emailType);
    console.log('Tone:', tone);

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
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    console.log('AI response received:', content.substring(0, 200));

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      jsonStr = content.replace(/```\n?/g, '');
    }

    const emailContent: EmailGenerationResponse = JSON.parse(jsonStr.trim());

    // Replace merge tags with actual values for preview
    const processedBody = emailContent.bodyHtml
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{vehicle_info\}\}/g, vehicleStr)
      .replace(/\{\{quote_amount\}\}/g, priceStr)
      .replace(/\{\{product_name\}\}/g, productStr)
      .replace(/\{\{company_name\}\}/g, companyName || '');

    return new Response(JSON.stringify({
      ...emailContent,
      bodyHtmlPreview: processedBody, // Preview with values filled in
      mergeTags: {
        customer_name: customerName,
        vehicle_info: vehicleStr,
        quote_amount: priceStr,
        product_name: productStr,
        company_name: companyName || ''
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-generate-email-content:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
