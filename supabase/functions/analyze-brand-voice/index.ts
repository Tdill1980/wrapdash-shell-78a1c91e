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
    const { organization_id, business_name, content } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Combine all content for analysis
    const combinedContent = [
      content.website_text && `WEBSITE CONTENT:\n${content.website_text}`,
      content.instagram_captions && `INSTAGRAM CAPTIONS:\n${content.instagram_captions}`,
      content.sample_emails && `SAMPLE EMAILS:\n${content.sample_emails}`,
      content.additional_content && `ADDITIONAL CONTENT:\n${content.additional_content}`
    ].filter(Boolean).join('\n\n---\n\n');

    if (!combinedContent.trim()) {
      throw new Error('No content provided for analysis');
    }

    console.log(`Analyzing brand voice for ${business_name || 'unknown business'}`);

    // Using all 7 extraction prompts combined into one comprehensive analysis
    const systemPrompt = `You are TradeDNA™, the Brand Voice Engine for WrapCommandAI.

Your task is to analyze all provided text from a company (website, social media captions, emails, reviews, product descriptions, quotes, customer replies, internal writing) and build a complete Brand Voice DNA profile.

RULES:
- Do NOT invent traits not present in the data
- Focus ONLY on observable patterns
- Capture tone, vocabulary, writing habits, sales style, emotional tendencies, and customer psychology
- Extract signature phrases but do NOT remove profanity if naturally part of brand
- Keep everything brand-specific
- If certain information cannot be determined from the content, use reasonable defaults based on the industry context

ANALYSIS STEPS:
1. TONE ANALYSIS - Classify using: Bold, Direct, Friendly, Technical, Luxury, Humorous, Emotional, Relatable, Informational, Authority-driven, Educational, High-energy, Serious, Conversational
2. VOCABULARY PATTERNS - Extract common phrases, signature phrases, words to avoid
3. SENTENCE STRUCTURE - Determine length, cadence, complexity
4. SALES STYLE - Identify approach, pressure level, CTA style, closing flavor
5. CUSTOMER PSYCHOLOGY - Analyze pain points, desires, emotional triggers, typical demographics
6. COMMUNICATION RULES - Determine email, DM, quote, and approveflow messaging styles

Return ONLY valid JSON with this exact structure:
{
  "tone": {
    "primary": "comma-separated tone descriptors",
    "energy_level": "high/medium/low",
    "formality": "formal/casual-professional/casual"
  },
  "persona": "one sentence describing the brand's persona",
  "brand_values": ["value1", "value2", "value3"],
  "vocabulary": {
    "signature_phrases": ["phrase1", "phrase2", "phrase3"],
    "common_words": ["word1", "word2", "word3"],
    "words_to_avoid": ["word1", "word2"]
  },
  "sentence_style": {
    "length": "short/medium/long",
    "cadence": "description of cadence",
    "complexity": "simple/moderate/complex",
    "examples": ["example sentence 1", "example sentence 2"]
  },
  "sales_style": {
    "approach": "description of sales approach",
    "pressure": "low/medium/high",
    "confidence": "low/medium/high",
    "cta_style": "description of CTA approach",
    "closing_flavor": "description of how they close"
  },
  "customer_profile": {
    "demographics": "description of target demographics",
    "pain_points": ["pain1", "pain2", "pain3"],
    "desires": ["desire1", "desire2", "desire3"],
    "emotional_triggers": ["trigger1", "trigger2"]
  },
  "communication_rules": {
    "email": {
      "greeting": "typical greeting style",
      "sign_off": "typical sign-off",
      "max_length": 150
    },
    "dm": {
      "response_time_promise": "expected response time",
      "emoji_usage": "none/minimal/moderate/heavy",
      "casual_level": "low/medium/high"
    },
    "quote": {
      "opening": "typical quote opening",
      "closing": "typical quote closing"
    },
    "approveflow": {
      "proof_intro": "how they introduce proofs",
      "revision_response": "how they handle revision requests"
    }
  },
  "do_not_do": ["rule1", "rule2", "rule3"],
  "brand_voice_summary": "A one-paragraph summary of the brand's overall voice and personality"
}`;

    const userPrompt = `Analyze the following content from "${business_name || 'this business'}" and extract their complete TradeDNA brand voice profile:

${combinedContent}

Remember: Return ONLY valid JSON matching the specified structure. No markdown, no explanations, just the JSON object.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
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
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    // Clean up the response (remove markdown if present)
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    // Parse the JSON
    let tradedna_profile;
    try {
      tradedna_profile = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', cleanedResponse.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('TradeDNA profile generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        tradedna_profile,
        organization_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-brand-voice:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
