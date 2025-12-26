import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadSalesGoalContext, formatSalesContextForPrompt } from "../_shared/sales-goal-loader.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business context for all agents
const WPW_BUSINESS_CONTEXT = `
=== WePrintWraps BUSINESS OVERVIEW ===
We are a B2B large-format print manufacturing company serving wrap installers, sign shops, and resellers.

OUR BRANDS:
1. WePrintWraps.com (WPW) - Main B2B print manufacturing. Wholesale pricing for professionals.
2. Ink & Edge Magazine - Industry publication for the wrap/sign community. Thought leadership + education.
3. WrapTVWorld - Video content brand. Tutorials, showcases, industry news.
4. Ink & Edge Distribution - Product distribution arm for wrap-related materials.

KEY PRODUCTS & PRICING:
- Avery MPI 1105: $5.27/sqft wholesale
- 3M IJ180Cv3: $6.32/sqft wholesale
- Window Perf 50/50: $5.32/sqft wholesale
- Custom Design Services: Starting at $750
- Average order value: $1,200-3,500

CUSTOMER TYPES:
- Wrap Installers (60%) - Need quality prints, fast turnaround, reliable colors
- Sign Shops (25%) - Volume buyers, price-sensitive, need consistency
- Resellers/Brokers (15%) - Buy wholesale, sell to end clients, margin-focused

COMPETITIVE ADVANTAGES:
- Fast turnaround (24-48hr standard, same-day rush available)
- Color matching guarantee
- No minimums for pros
- Free file review before printing

CURRENT PRIORITIES:
1. Drive repeat orders from existing customers
2. Convert first-time buyers into regulars
3. Reduce quote-to-order time
4. Increase average order value through upsells
`;

// Agent configurations with enhanced business intelligence
const AGENT_CONFIGS: Record<string, { name: string; role: string; systemPrompt: string }> = {
  alex_morgan: {
    name: "Alex Morgan",
    role: "Quotes & Pricing",
    systemPrompt: `You are Alex Morgan, the quoting specialist at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Create accurate, competitive quotes
- Follow up on stalled quotes
- Upsell appropriate add-ons (lamination, rush delivery, design services)
- Convert quotes to orders

PRICING INTELLIGENCE:
- Avery MPI 1105: $5.27/sqft
- 3M IJ180Cv3: $6.32/sqft
- Window Perf 50/50: $5.32/sqft
- Rush delivery: +15%
- Lamination: +$0.85/sqft

PROACTIVE SUGGESTIONS (use when relevant):
- If quote is >3 days old: "Want me to send a follow-up with a time-limited incentive?"
- If customer is first-time: "Should I include our sample program info?"
- If large order: "Want me to suggest volume pricing tiers?"
- If behind on monthly goals: "This quote could help hit our target - want me to add urgency?"

CLARIFICATION MODE:
- Ask questions to understand what the user wants
- Restate your understanding before confirming
- Do NOT execute until confirmed

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  grant_miller: {
    name: "Grant Miller", 
    role: "Design & Files",
    systemPrompt: `You are Grant Miller, the design specialist at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Review customer files for print-readiness
- Identify and communicate file issues
- Provide design guidance and best practices
- Manage design projects and revisions

FILE REQUIREMENTS:
- Formats: PDF, AI, EPS only (no JPG/PNG for final output)
- Resolution: Minimum 72 DPI at full scale
- Color mode: CMYK (not RGB)
- Text: Convert to outlines
- Bleed: 0.25" minimum

PROACTIVE SUGGESTIONS:
- If seeing common errors: "I'm seeing a lot of [issue] - should I create educational content?"
- If file is problematic: "Want me to reach out proactively with fixes before they ask?"
- If design is exceptional: "This would make great portfolio content - suggest sharing?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  casey_ramirez: {
    name: "Casey Ramirez",
    role: "Social & DMs", 
    systemPrompt: `You are Casey Ramirez, handling social media engagement and DMs at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Respond to social media DMs and comments
- Engage with community posts
- Route hot leads to sales
- Build brand presence and relationships

ENGAGEMENT PRIORITIES:
1. Installers showing completed work = potential customers
2. Questions about materials/processes = education opportunity
3. Complaints or issues = escalate immediately
4. Competitor mentions = competitive intelligence

PROACTIVE SUGGESTIONS:
- If DM mentions pricing: "Hot lead detected - want me to route to Alex for a quote?"
- If seeing repeated questions: "Should I suggest creating FAQ content about [topic]?"
- If influencer engagement: "This person has [X] followers - worth prioritizing?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  jordan_lee: {
    name: "Jordan Lee",
    role: "Website & Sales",
    systemPrompt: `You are Jordan Lee, handling website chat and inbound sales at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Handle live website chat inquiries
- Qualify leads and route appropriately
- Answer product/service questions
- Convert inquiries to quotes/orders

QUALIFICATION CRITERIA:
- Hot: "Need a quote", "Ready to order", mentions specific vehicle/project
- Warm: "Pricing info", "How do you compare to [competitor]"
- Cold: "Just browsing", "Maybe later"

PROACTIVE SUGGESTIONS:
- If hot lead: "This is ready for a quote - want me to ping Alex immediately?"
- If competitor mention: "They mentioned [competitor] - want me to emphasize our [advantage]?"
- If repeat visitor: "This person has been back 3 times - time for proactive outreach?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  taylor_brooks: {
    name: "Taylor Brooks",
    role: "Partnerships & Field Sales",
    systemPrompt: `You are Taylor Brooks, handling partnerships and field sales at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Manage wrap shop partnerships
- Coordinate field visits and demos
- Negotiate volume pricing agreements
- Build strategic relationships

PARTNERSHIP TIERS:
- Standard: Regular wholesale pricing
- Preferred: 5% volume discount, priority support
- Elite: 10% discount, dedicated rep, co-marketing

PROACTIVE SUGGESTIONS:
- If shop is high volume: "This shop ordered $X last quarter - time to offer Preferred tier?"
- If shop is in target area: "We're expanding in [region] - worth a visit?"
- If Jackson's schedule: "Jackson has availability [dates] - should I suggest these shops?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  evan_porter: {
    name: "Evan Porter",
    role: "Affiliates",
    systemPrompt: `You are Evan Porter, managing the affiliate program at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Recruit and onboard affiliates
- Track affiliate performance
- Process affiliate payouts
- Identify top performers for growth

AFFILIATE PROGRAM:
- Standard commission: 10% of first order
- Recurring: 5% of repeat orders for 12 months
- Payout threshold: $100 minimum
- Cookie duration: 30 days

PROACTIVE SUGGESTIONS:
- If affiliate is performing well: "This affiliate drove $X this month - worth featuring?"
- If affiliate content is great: "Their content is fire - should I repurpose for our channels?"
- If affiliate inactive: "Haven't seen activity in 30 days - send re-engagement?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  emily_carter: {
    name: "Emily Carter",
    role: "Marketing Content",
    systemPrompt: `You are Emily Carter, handling marketing content (emails, ads, campaigns) at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Create email campaigns
- Write ad copy for Meta/Google
- Develop content calendars
- Drive conversions through messaging

CONTENT PRIORITIES:
1. Seasonal campaigns (holidays, wrap season peaks)
2. Product launches and promotions
3. Customer success stories
4. Educational content that drives trust

PROACTIVE SUGGESTIONS:
- If behind on goals: "We're X% behind - should I draft an urgency-based campaign?"
- If customer success story: "This install looks amazing - want me to turn it into a case study?"
- If slow period: "It's quiet - time for a flash sale or limited offer?"
- If content is performing: "This email had 40% open rate - should we double down on this angle?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  noah_bennett: {
    name: "Noah Bennett",
    role: "Social Content",
    systemPrompt: `You are Noah Bennett, Social Content Creator at WePrintWraps.

${WPW_BUSINESS_CONTEXT}

🚨 CRITICAL SYSTEM UPDATE 🚨
Creatomate, VIDEO_CONTENT blocks, and external renderers are DISABLED.

You MUST NOT:
- Use VIDEO_CONTENT blocks
- Ask for image_url or video_url
- Reference Creatomate or external rendering APIs

🎬 CONTENT CREATION VIA CONTENT FACTORY 🎬
You create content using EXISTING ContentBox assets via Content Factory + MightyEdit.

When content is ready to be created, output ONLY this block:

===CREATE_CONTENT===
action: create_content
content_type: reel | story | short | ad
platform: instagram | facebook | youtube | meta
asset_source: contentbox | attached
asset_query:
  tags: [chicago, test_lab, ppf, inkfusion]
  type: video
  limit: 3
hook: [max 6 words - attention grabbing]
cta: [max 8 words - call to action]
overlays:
  - text: [overlay text]
    start: 2
    duration: 3
  - text: [overlay text]
    start: 6
    duration: 3
caption: [caption text for social post]
hashtags: [#wraplife #ppf #chicago]
===END_CREATE_CONTENT===

CONTENT STRATEGY:
- Hooks that stop the scroll: Pain point, surprising stat, or bold claim
- CTAs that convert: Clear action, urgency when appropriate
- Platform optimization: Reels = entertainment first, Stories = behind-scenes, Shorts = quick tips

PROACTIVE SUGGESTIONS:
- If content is for a sale: "Should I add urgency with a countdown or limited-time messaging?"
- If we have great footage: "This video could work as 3 different pieces - want me to create a series?"
- If behind on goals: "More aggressive CTAs might help - want me to push harder?"
- If successful content: "This format worked well - should I create more in this style?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  ryan_mitchell: {
    name: "Ryan Mitchell",
    role: "Editorial (Ink & Edge)",
    systemPrompt: `You are Ryan Mitchell, editorial authority for Ink & Edge Magazine.

${WPW_BUSINESS_CONTEXT}

YOUR ROLE & RESPONSIBILITIES:
- Create long-form editorial content
- Manage magazine articles and features
- Write industry thought leadership
- Build the Ink & Edge brand voice

EDITORIAL VOICE:
- Authoritative but accessible
- Industry insider perspective
- Educational without being condescending
- Celebrates the craft of wrapping

CONTENT TYPES:
1. Feature articles (2000-3000 words)
2. How-to guides (1000-1500 words)
3. Industry news & analysis (500-800 words)
4. Installer spotlights (800-1200 words)

PROACTIVE SUGGESTIONS:
- If industry news: "This could be a great news piece - want me to draft a take?"
- If installer doing great work: "This person would make a great feature - should I reach out?"
- If FAQ pattern emerging: "Seeing lots of questions about [topic] - article opportunity?"

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, agent_id, message, chat_id, context, organization_id, user_id, description, assigned_to } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ACTION: start - Create new chat
    if (action === "start") {
      // Check if user_id is a valid UUID, otherwise store in context
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = user_id && uuidRegex.test(user_id);
      
      const chatContext: Record<string, unknown> = {
        ...(context || {}),
        orchestrator: user_id || "unknown", // Store username in context
      };

      // If there's a conversation_id in context, fetch the email thread
      const conversationId = chatContext.conversation_id || chatContext.conversationId;
      if (conversationId) {
        console.log("Loading messages for conversation:", conversationId);
        const { data: threadMessages, error: threadError } = await supabase
          .from("messages")
          .select("id, direction, sender_name, content, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(20); // Limit to last 20 messages

        if (threadError) {
          console.error("Failed to load thread messages:", threadError);
        } else if (threadMessages && threadMessages.length > 0) {
          // Format the email thread for the agent
          const formattedThread = threadMessages.map((msg: any) => {
            const direction = msg.direction === "inbound" ? "CUSTOMER" : "WPW TEAM";
            const sender = msg.sender_name || direction;
            const time = new Date(msg.created_at).toLocaleString();
            return `[${direction}] ${sender} (${time}):\n${msg.content}`;
          }).join("\n\n---\n\n");

          chatContext.email_thread = formattedThread;
          chatContext.thread_message_count = threadMessages.length;
          console.log(`Loaded ${threadMessages.length} messages into context`);
        }
      }

      const { data: chat, error } = await supabase
        .from("agent_chats")
        .insert({
          organization_id,
          user_id: isValidUuid ? user_id : organization_id, // Use org_id as fallback
          agent_id,
          status: "clarifying",
          context: chatContext,
        })
        .select()
        .single();

      if (error) throw error;

      const agentConfig = AGENT_CONFIGS[agent_id] || { name: agent_id, role: "Agent" };

      return new Response(
        JSON.stringify({
          success: true,
          chat_id: chat.id,
          agent: {
            id: agent_id,
            name: agentConfig.name,
            role: agentConfig.role,
          },
          messages: [],
          thread_loaded: !!chatContext.email_thread,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: send - Send message and get AI response
    if (action === "send") {
      if (!chat_id || !message) {
        throw new Error("Missing chat_id or message");
      }

      // Check if this is an image generation request
      const imageKeywords = [
        "create image", "generate image", "make image", "create an image",
        "generate an image", "make an image", "create a visual", "generate visual",
        "design image", "create graphic", "make graphic", "render image",
        "create photo", "generate photo", "create picture", "make picture",
        "create artwork", "design artwork", "create illustration"
      ];
      const lowerMessage = message.toLowerCase();
      const isImageRequest = imageKeywords.some(kw => lowerMessage.includes(kw));

      // Save user message with attachments if any
      const { attachments } = body;
      await supabase.from("agent_chat_messages").insert({
        agent_chat_id: chat_id,
        sender: "user",
        content: message,
        metadata: attachments?.length ? { attachments } : null,
      });

      // Get chat history
      const { data: chatHistory } = await supabase
        .from("agent_chat_messages")
        .select("*")
        .eq("agent_chat_id", chat_id)
        .order("created_at", { ascending: true });

      // Get chat details
      const { data: chat } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("id", chat_id)
        .single();

      const agentConfig = AGENT_CONFIGS[chat?.agent_id] || {
        name: "Agent",
        role: "Assistant",
        systemPrompt: "You are a helpful assistant in CLARIFICATION MODE. Ask questions to understand before executing.",
      };

      // Load sales goal context to give agents revenue awareness
      let salesContext = "";
      try {
        const salesData = await loadSalesGoalContext(chat?.organization_id);
        salesContext = formatSalesContextForPrompt(salesData);
        console.log("Sales context loaded:", salesData.status, salesData.percentComplete.toFixed(1) + "%");
      } catch (e) {
        console.error("Failed to load sales context:", e);
      }

      // Extract email thread from chat context if available
      const chatContext = (chat?.context || {}) as Record<string, unknown>;
      const emailThread = chatContext.email_thread as string | undefined;
      const threadSubject = chatContext.subject as string | undefined;
      const threadChannel = chatContext.channel as string | undefined;
      const customerName = chatContext.customer_name as string | undefined;

      // Build email thread section for system prompt
      let emailThreadSection = "";
      if (emailThread) {
        emailThreadSection = `
=== EMAIL/MESSAGE THREAD YOU ARE RESPONDING TO ===
Subject: ${threadSubject || "No subject"}
Channel: ${threadChannel || "Unknown"}
Customer: ${customerName || "Unknown"}

${emailThread}

=== END OF THREAD ===

IMPORTANT: You have full visibility into this conversation. Reference specific details from the thread when discussing with the orchestrator.
`;
        console.log("Including email thread in system prompt");
      }

      // Build system prompt with sales context and email thread
      const enhancedSystemPrompt = `${agentConfig.systemPrompt}

${emailThreadSection}

${salesContext}

Use this sales context when relevant:
- If creating content/emails, consider incorporating urgency if we're behind on goals
- If quoting, prioritize closing deals that help hit targets
- Suggest proactive actions when appropriate based on goal status

IMAGE GENERATION CAPABILITY:
You can generate images when asked. If the user requests an image, describe what you'll create and then the system will generate it.
When an image is generated, it will be included in your response.
`;

      // Handle IMAGE GENERATION
      if (isImageRequest) {
        console.log("Image generation request detected:", message);
        
        const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
        if (!lovableApiKey) {
          throw new Error("LOVABLE_API_KEY not configured for image generation");
        }

        try {
          // Generate image using Lovable AI Gateway
          const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image-preview",
              messages: [
                { role: "user", content: message }
              ],
              modalities: ["image", "text"],
            }),
          });

          if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error("Image generation failed:", errorText);
            throw new Error(`Image generation failed: ${imageResponse.status}`);
          }

          const imageData = await imageResponse.json();
          console.log("Image generation response received");

          const textContent = imageData.choices?.[0]?.message?.content || "I've generated the image for you.";
          const images = imageData.choices?.[0]?.message?.images || [];
          
          // Extract the first image URL (base64)
          const generatedImageUrl = images[0]?.image_url?.url || null;

          // Save agent response with image
          await supabase.from("agent_chat_messages").insert({
            agent_chat_id: chat_id,
            sender: "agent",
            content: textContent,
            metadata: { 
              image_generated: true,
              image_url: generatedImageUrl,
              confirmed: false 
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: textContent,
              image_url: generatedImageUrl,
              confirmed: false,
              suggested_task: null,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (imageError: unknown) {
          console.error("Image generation error:", imageError);
          // Fall back to text response explaining the error
          const errMsg = imageError instanceof Error ? imageError.message : "Unknown error";
          const errorMessage = `I encountered an issue generating the image: ${errMsg}. Let me know if you'd like me to try again or describe what you need differently.`;
          
          await supabase.from("agent_chat_messages").insert({
            agent_chat_id: chat_id,
            sender: "agent",
            content: errorMessage,
            metadata: { image_error: true },
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: errorMessage,
              confirmed: false,
              suggested_task: null,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Build messages for AI (regular text response)
      const aiMessages: any[] = [
        { role: "system", content: enhancedSystemPrompt },
      ];

      // Scan ALL chat history for video attachments (historical + current)
      const historicalVideoAttachments: any[] = [];
      for (const m of chatHistory || []) {
        const meta = m.metadata as Record<string, any> | null;
        if (m.sender === "user" && meta?.attachments?.length) {
          for (const att of meta.attachments) {
            if (att.type?.startsWith('video/') || att.url?.match(/\.(mp4|mov|webm|avi)$/i)) {
              historicalVideoAttachments.push({
                ...att,
                uploadedAt: m.created_at,
                messageContent: m.content?.substring(0, 50) // First 50 chars for context
              });
            }
          }
        }
      }

      // Check current message for video attachments
      const attachmentsMeta = body.attachments || [];
      const currentVideoAttachments = attachmentsMeta.filter((att: any) => 
        att.type?.startsWith('video/') || att.url?.match(/\.(mp4|mov|webm|avi)$/i)
      );
      
      // Combine all videos (current first, then historical)
      const allVideoAttachments = [...currentVideoAttachments, ...historicalVideoAttachments];
      
      // Add video context for Noah if ANY videos exist in this conversation
      if (allVideoAttachments.length > 0 && chat?.agent_id === 'noah_bennett') {
        const mostRecentVideo = allVideoAttachments[0];
        const videoContext = `
🎬 VIDEO ASSETS AVAILABLE IN THIS CONVERSATION:
${allVideoAttachments.map((v: any, i: number) => `${i + 1}. ${v.name || 'Video'}: ${v.url}${v.uploadedAt ? ` (uploaded earlier)` : ' (just attached)'}`).join('\n')}

MOST RECENT VIDEO URL: ${mostRecentVideo.url}

✅ YOU CAN USE THESE VIDEOS DIRECTLY IN YOUR CREATE_CONTENT BLOCK!
When outputting your CREATE_CONTENT block, use:

asset_source: attached
attached_assets:
  - url: ${mostRecentVideo.url}
    type: video
    name: ${mostRecentVideo.name || 'Attached Video'}

The user has ${allVideoAttachments.length} video(s) ready. DO NOT ask them to upload - PROCEED to CREATE_CONTENT.
When they give content creation instructions, emit the CREATE_CONTENT block with the attached video URL.
`;
        aiMessages.push({ role: "system", content: videoContext });
        console.log(`[agent-chat] Added video context for Noah: ${currentVideoAttachments.length} current + ${historicalVideoAttachments.length} historical = ${allVideoAttachments.length} total video(s)`);
        
        // AUTO-PROCEED: If videos attached AND user is requesting content, skip confirmation
        const lowerMessage = body.message?.toLowerCase() || '';
        const contentKeywords = ['create', 'make', 'story', 'reel', 'video', 'post', 'instagram', 'content', 'promo', 'sale', 'discount', 'christmas', 'holiday'];
        const isContentRequest = contentKeywords.some(kw => lowerMessage.includes(kw));
        
        if (isContentRequest) {
          aiMessages.push({
            role: "system",
            content: `
AUTOMATION OVERRIDE: User has attached ${allVideoAttachments.length} video(s) AND is requesting content creation.
You MUST proceed directly to CREATE_CONTENT output.
DO NOT ask for confirmation. DO NOT say you "cannot process" the video.
The video URL is: ${mostRecentVideo.url}
Include it as attached_assets in your CREATE_CONTENT block like this:

===CREATE_CONTENT===
action: create_content
content_type: story
platform: instagram
asset_source: attached
attached_assets:
  - url: ${mostRecentVideo.url}
    type: video
    name: ${mostRecentVideo.name || 'Attached Video'}
hook: [extract from user message]
cta: [based on context]
overlays:
  - text: [price or key message] start: 2 duration: 3
caption: [short caption]
hashtags: #weprintwraps
===END_CREATE_CONTENT===

EMIT THIS BLOCK NOW. Do not ask for clarification.
`
          });
          console.log(`[agent-chat] AUTOMATION OVERRIDE: Content request detected with video, forcing CREATE_CONTENT`);
        }
      }

      // Add chat history with vision support for attachments
      for (const m of chatHistory || []) {
        const meta = m.metadata as Record<string, any> | null;
        if (m.sender === "user" && meta?.attachments?.length) {
          // Build multimodal content for messages with attachments
          const contentParts: any[] = [{ type: "text", text: m.content }];
          for (const att of meta.attachments) {
            // Handle images with vision
            if (att.url && (att.type?.startsWith("image/") || att.url.match(/\.(png|jpg|jpeg|webp|gif)$/i))) {
              contentParts.push({
                type: "image_url",
                image_url: { url: att.url }
              });
            }
            // Handle videos with text description (AI can't watch videos, but we tell it the URL)
            if (att.type?.startsWith('video/') || att.url?.match(/\.(mp4|mov|webm|avi)$/i)) {
              contentParts.push({
                type: "text",
                text: `[VIDEO ATTACHED: ${att.name || 'video'} - URL: ${att.url}]`
              });
            }
          }
          aiMessages.push({ role: "user", content: contentParts });
        } else {
          aiMessages.push({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content,
          });
        }
      }

      // Call AI using Lovable AI Gateway for vision support
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI response error:", errorText);
        throw new Error(`AI request failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const agentMessage = aiData.choices?.[0]?.message?.content || "I'm not sure how to respond.";

      // Check if agent confirmed understanding
      const confirmed = agentMessage.toLowerCase().includes("ready when you say go") ||
                       agentMessage.toLowerCase().includes("i understand. i will");

      // Save agent response
      await supabase.from("agent_chat_messages").insert({
        agent_chat_id: chat_id,
        sender: "agent",
        content: agentMessage,
        metadata: { confirmed },
      });

      // Update chat status if confirmed
      if (confirmed && chat?.status === "clarifying") {
        await supabase
          .from("agent_chats")
          .update({ status: "confirmed", updated_at: new Date().toISOString() })
          .eq("id", chat_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: agentMessage,
          confirmed,
          suggested_task: confirmed ? extractSuggestedTask(agentMessage) : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: delegate - Create task and update status
    if (action === "delegate") {
      if (!chat_id) throw new Error("Missing chat_id");

      const { data: chat } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("id", chat_id)
        .single();

      if (!chat) throw new Error("Chat not found");
      if (chat.status !== "confirmed") {
        throw new Error("Cannot delegate: agent has not confirmed understanding");
      }

      const safeDescription = (description || "").toString().trim();
      if (!safeDescription) throw new Error("Missing description");

      const ctx = (chat.context || {}) as Record<string, unknown>;
      const conversationId = (ctx.conversationId || ctx.conversation_id) as string | undefined;
      const contactId = (ctx.contactId || ctx.contact_id) as string | undefined;
      const subject = (ctx.subject as string | undefined) || undefined;
      const recipientInbox = (ctx.recipientInbox as string | undefined) ||
        (ctx.recipient_inbox as string | undefined) ||
        undefined;
      const channel = (ctx.channel as string | undefined) || undefined;

      const linkedLine = subject
        ? `\n\nLinked thread: ${subject}${recipientInbox ? ` • ${recipientInbox}` : ""}${channel ? ` • ${channel}` : ""}`
        : "";

      // `tasks.assigned_to` is a UUID. Guard against accidentally passing usernames like "trish".
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const assignedToUuid = typeof assigned_to === "string" && uuidRegex.test(assigned_to) ? assigned_to : null;

      // Create task (linked to the exact conversation when available)
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          organization_id: chat.organization_id,
          title: safeDescription,
          description: `Delegated from agent chat. Agent: ${chat.agent_id}${linkedLine}`,
          assigned_agent: chat.agent_id,
          status: "pending",
          priority: "normal",
          conversation_id: conversationId || null,
          contact_id: contactId || null,
          customer: subject || null,
          assigned_to: assignedToUuid,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create delegation log
      await supabase.from("delegation_log").insert({
        agent_chat_id: chat_id,
        task_id: task.id,
        delegated_by: assigned_to || "Unknown",
        summary: safeDescription,
      });

      // Update chat status
      await supabase
        .from("agent_chats")
        .update({ status: "delegated", updated_at: new Date().toISOString() })
        .eq("id", chat_id);

      return new Response(
        JSON.stringify({
          success: true,
          task_id: task.id,
          message: "Task delegated successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: history - Get chat history
    if (action === "history") {
      if (!chat_id) throw new Error("Missing chat_id");

      const { data: messages } = await supabase
        .from("agent_chat_messages")
        .select("*")
        .eq("agent_chat_id", chat_id)
        .order("created_at", { ascending: true });

      const { data: chat } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("id", chat_id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          chat,
          messages: messages || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: list - List recent chats for a user (optionally filtered by agent)
    if (action === "list") {
      if (!user_id) throw new Error("Missing user_id");

      let query = supabase
        .from("agent_chats")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (agent_id) {
        query = query.eq("agent_id", agent_id);
      }

      const { data: chats, error: chatsError } = await query;

      if (chatsError) throw chatsError;

      // Get last message for each chat
      const chatsWithPreview = await Promise.all(
        (chats || []).map(async (chat) => {
          const { data: lastMsg } = await supabase
            .from("agent_chat_messages")
            .select("content, sender, created_at")
            .eq("agent_chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const agentConfig = AGENT_CONFIGS[chat.agent_id];

          return {
            ...chat,
            agent_name: agentConfig?.name || chat.agent_id,
            agent_role: agentConfig?.role || "Agent",
            last_message: lastMsg?.content?.substring(0, 100) || null,
            last_message_sender: lastMsg?.sender || null,
            last_message_at: lastMsg?.created_at || chat.updated_at,
          };
        })
      );

      return new Response(
        JSON.stringify({
          success: true,
          chats: chatsWithPreview,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: resume - Resume an existing chat
    if (action === "resume") {
      if (!chat_id) throw new Error("Missing chat_id");

      const { data: chat, error: chatError } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("id", chat_id)
        .single();

      if (chatError || !chat) throw new Error("Chat not found");

      const { data: messages, error: msgError } = await supabase
        .from("agent_chat_messages")
        .select("*")
        .eq("agent_chat_id", chat_id)
        .order("created_at", { ascending: true });

      if (msgError) throw msgError;

      const agentConfig = AGENT_CONFIGS[chat.agent_id];

      // Check if chat was already confirmed (look for confirmed message)
      const hasConfirmedMessage = (messages || []).some(
        (m) => m.sender === "agent" && m.metadata?.confirmed === true
      );

      return new Response(
        JSON.stringify({
          success: true,
          chat_id: chat.id,
          agent: {
            id: chat.agent_id,
            name: agentConfig?.name || chat.agent_id,
            role: agentConfig?.role || "Agent",
          },
          messages: (messages || []).map((m) => ({
            id: m.id,
            sender: m.sender,
            content: m.content,
            created_at: m.created_at,
            metadata: m.metadata,
          })),
          confirmed: hasConfirmedMessage,
          status: chat.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Agent chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper to extract suggested task from agent message
function extractSuggestedTask(message: string): { type: string; description: string } | null {
  const match = message.match(/I will ([^.]+)\./i);
  if (match) {
    return {
      type: "general",
      description: match[1].trim(),
    };
  }
  return null;
}
