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

    // COMPREHENSIVE 7-PROMPT TRADEDNA EXTRACTION SYSTEM
    const systemPrompt = `You are TradeDNA™, the Brand Voice Engine for WrapCommandAI.

Your task is to analyze ALL provided text from a company (website, social media captions, emails, reviews, product descriptions, quotes, customer replies, internal writing) and build a complete Brand Voice DNA profile using a 7-stage extraction process.

## STAGE 1: MASTER SCRAPING
First, identify and extract:
- Text patterns and recurring phrases
- Common sentence structures
- Signature writing habits
- Tone indicators
- Emotional style
- Persuasive devices
- Brand personality clues

## STAGE 2: BRAND VOICE EXTRACTION (CORE)
Analyze all content to determine:
- Tone, vocabulary, writing habits
- Sales style, emotional tendencies
- Customer psychology
- Extract signature phrases (keep profanity if naturally part of brand)

## STAGE 3: TONE MODEL CLASSIFICATION
Classify tone using ONLY evidence from the text. Choose from:
- Bold, Direct, Friendly, Technical, Luxury, Humorous
- Emotional, Relatable, Informational, Authority-driven
- Educational, High-energy, Serious, Conversational

## STAGE 4: CUSTOMER PSYCHOLOGY
Determine from the language:
- What customers fear
- What customers want
- What objections appear repeatedly
- What emotions the brand tries to activate
- What type of customer buys most often
- Why they buy
- What they need to see to say "yes"

## STAGE 5: SALES STYLE EXTRACTION
Identify the sales approach:
- Soft, firm, high-pressure, educational, storytelling
- Comparison-based, value-driven, aspirational, humorous
- CTA style: short/hard CTAs, soft suggestions, directional, aggressive

## STAGE 6: COMMUNICATION RULESET
Extract communication behaviors for each channel:
- Email rules (greetings, tone, length)
- DM rules (response time, emoji usage, casualness)
- Quote rules (opening, closing, urgency)
- ApproveFlow rules (proof intro, revision response)
- Support rules (problem-solving style)

## STAGE 7: FINAL CONSOLIDATION
Combine all extracted data into ONE unified JSON object.
Remove duplicates, consolidate overlapping fields, keep only actionable insights.

## CRITICAL RULES:
- Do NOT invent traits not present in the data
- Focus ONLY on observable patterns
- If certain information cannot be determined, use reasonable defaults for wrap/print industry
- Keep everything brand-specific

Return ONLY valid JSON with this exact structure:
{
  "tone": {
    "primary": "comma-separated tone descriptors from Stage 3",
    "energy_level": "high/medium/low",
    "formality": "formal/casual-professional/casual"
  },
  "persona": "one sentence describing the brand's persona",
  "brand_values": ["value1", "value2", "value3", "value4", "value5"],
  "vocabulary": {
    "signature_phrases": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5"],
    "common_words": ["word1", "word2", "word3", "word4", "word5"],
    "words_to_avoid": ["word1", "word2", "word3"]
  },
  "sentence_style": {
    "length": "short/medium/long",
    "cadence": "description of rhythm and flow",
    "complexity": "simple/moderate/complex",
    "examples": ["example sentence 1", "example sentence 2", "example sentence 3"]
  },
  "sales_style": {
    "approach": "description of sales approach",
    "pressure": "low/medium/high",
    "confidence": "low/medium/high",
    "cta_style": "description of CTA approach",
    "closing_flavor": "description of how they close deals"
  },
  "customer_profile": {
    "demographics": "description of target demographics",
    "pain_points": ["pain1", "pain2", "pain3"],
    "desires": ["desire1", "desire2", "desire3"],
    "emotional_triggers": ["trigger1", "trigger2", "trigger3"],
    "objection_patterns": ["objection1", "objection2"]
  },
  "communication_rules": {
    "email": {
      "greeting": "typical greeting style",
      "sign_off": "typical sign-off",
      "max_length": 150,
      "rules": ["always start with...", "never do...", "tone should be..."]
    },
    "dm": {
      "response_time_promise": "expected response time",
      "emoji_usage": "none/minimal/moderate/heavy",
      "casual_level": "low/medium/high",
      "rules": ["rule1", "rule2"]
    },
    "quote": {
      "opening": "typical quote opening line",
      "closing": "typical quote closing line",
      "rules": ["rule1", "rule2"]
    },
    "approveflow": {
      "proof_intro": "how they introduce design proofs",
      "revision_response": "how they handle revision requests",
      "rules": ["rule1", "rule2"]
    },
    "support": {
      "tone": "support conversation tone",
      "problem_solving_style": "how they approach problems",
      "rules": ["rule1", "rule2"]
    }
  },
  "do_not_do": ["rule1", "rule2", "rule3", "rule4", "rule5"],
  "brand_voice_summary": "A compelling one-paragraph summary of the brand's overall voice, personality, and how it should communicate across all channels"
}`;

    const userPrompt = `Analyze the following content from "${business_name || 'this business'}" and extract their complete TradeDNA brand voice profile using all 7 extraction stages:

${combinedContent}

Remember: 
- Return ONLY valid JSON matching the specified structure
- No markdown, no explanations, just the JSON object
- Extract real patterns from the content, don't invent
- For wrap/print industry context, lean into professional, confident, service-oriented defaults if data is sparse`;

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
        max_tokens: 6000
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

    console.log('TradeDNA profile generated successfully with 7-stage extraction');

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
