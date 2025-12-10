import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_PROMPTS = {
  sabri: `Generate captions in Sabri Suby direct-response style:
- UPPERCASE for emphasis
- Punchy, aggressive hooks
- Problem-agitation-solution flow
- Urgency and scarcity language
- Use 🔥 💰 ⚡ emojis sparingly
- Short, impactful phrases (2-5 words max)
- Examples: "THIS IS INSANE", "WAIT FOR IT", "WATCH THE REVEAL 🔥"`,

  dara: `Generate captions in Dara Denney UGC style:
- Lowercase, conversational tone
- Relatable and authentic
- "I didn't think this would work" vibes
- Soft CTAs, testimonial feel
- Use emojis naturally
- Storytelling pacing
- Examples: "wait for this...", "honestly obsessed", "the way this turned out 😍"`,

  clean: `Generate captions in clean minimal style:
- Professional and simple
- No emojis
- Sentence case
- Clear and direct
- Elegant pacing
- Examples: "Premium wrap finish", "The transformation", "Before and after"`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_url, style = "sabri", duration = 15 } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const stylePrompt = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.sabri;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a viral reel caption generator for the vehicle wrap industry.

${stylePrompt}

Generate 4-6 timed captions for a ${duration}-second reel.
Each caption should appear at strategic moments for maximum retention.

Structure:
1. Hook caption (0-2s) - grab attention immediately
2. Tease caption (2-4s) - build anticipation
3. Process captions (4-10s) - show the transformation
4. Reveal caption (10-12s) - showcase the result
5. CTA caption (12-15s) - call to action or brand tag`,
          },
          {
            role: "user",
            content: `Generate viral captions for a vehicle wrap reel${video_url ? ` (video: ${video_url})` : ''}.
Duration: ${duration} seconds.
Style: ${style}.

Create engaging captions that will maximize watch time and engagement.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_captions",
              description: "Return timed captions for the reel",
              parameters: {
                type: "object",
                properties: {
                  captions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Caption text" },
                        start: { type: "number", description: "Start time in seconds" },
                        end: { type: "number", description: "End time in seconds" },
                        emoji: { type: "string", description: "Optional emoji" },
                      },
                      required: ["text", "start", "end"],
                    },
                  },
                },
                required: ["captions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_captions" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      
      // Return fallback captions
      const fallbackCaptions = [
        { text: style === "sabri" ? "WATCH THIS 🔥" : style === "dara" ? "wait for it..." : "The transformation", start: 0, end: 2 },
        { text: style === "sabri" ? "THIS IS INSANE" : style === "dara" ? "honestly obsessed" : "Premium finish", start: 2, end: 4 },
        { text: style === "sabri" ? "THE REVEAL" : style === "dara" ? "the way this turned out 😍" : "Before and after", start: 10, end: 12 },
        { text: style === "sabri" ? "LINK IN BIO 💰" : style === "dara" ? "dm for info ✨" : "Contact us", start: 12, end: 15 },
      ];
      
      return new Response(
        JSON.stringify({ success: true, captions: fallbackCaptions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, captions: result.captions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Failed to generate captions");
  } catch (error: unknown) {
    console.error("ai-generate-captions error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errMsg, captions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
