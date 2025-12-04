import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageContent, senderName, subject } = await req.json();
    
    if (!messageContent) {
      return new Response(
        JSON.stringify({ error: 'Message content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing message for priority detection...');
    console.log('Message preview:', messageContent.substring(0, 100));

    const systemPrompt = `You are an AI assistant that analyzes customer messages for a vehicle wrap business. Analyze the message and return a JSON object with:

1. "priority": One of "urgent", "high", "normal", "low"
   - urgent: Words like "ASAP", "emergency", "urgent", "immediately", "rush order", deadline within 24-48 hours
   - high: Time-sensitive but not emergency, mentions specific deadlines, repeat customers
   - normal: Standard inquiries, general questions
   - low: FYI messages, newsletters, spam-like content

2. "message_type": One of "quote_request", "order_inquiry", "support", "general"
   - quote_request: Asking for pricing, estimates, quotes, "how much", mentions vehicle + service
   - order_inquiry: Asking about existing order status, tracking, shipment, delivery
   - support: Technical issues, complaints, problems with service
   - general: Everything else

3. "extracted_data": Object with any relevant info extracted:
   - "vehicle": Vehicle year/make/model if mentioned (e.g., "2024 Ford F-150")
   - "service": Service type if mentioned (e.g., "full wrap", "color change", "PPF")
   - "deadline": Any deadline mentioned
   - "contact_name": Customer name if mentioned

Return ONLY valid JSON, no explanation.`;

    const userPrompt = `Analyze this customer message:

${subject ? `Subject: ${subject}` : ''}
${senderName ? `From: ${senderName}` : ''}

Message:
${messageContent}`;

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
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return default values if parsing fails
      analysis = {
        priority: 'normal',
        message_type: 'general',
        extracted_data: {}
      };
    }

    // Validate and normalize the response
    const validPriorities = ['urgent', 'high', 'normal', 'low'];
    const validTypes = ['quote_request', 'order_inquiry', 'support', 'general'];
    
    const result = {
      priority: validPriorities.includes(analysis.priority) ? analysis.priority : 'normal',
      message_type: validTypes.includes(analysis.message_type) ? analysis.message_type : 'general',
      extracted_data: analysis.extracted_data || {}
    };

    console.log('Analysis result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-detect-priority:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
