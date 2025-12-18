import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadSalesGoalContext, formatSalesContextForPrompt } from "../_shared/sales-goal-loader.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agent configurations for clarification mode
const AGENT_CONFIGS: Record<string, { name: string; role: string; systemPrompt: string }> = {
  alex_morgan: {
    name: "Alex Morgan",
    role: "Quotes & Pricing",
    systemPrompt: `You are Alex Morgan, the quoting specialist at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand what the user wants
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create tasks or quotes
- Only say you're ready when you FULLY understand

WPW PRICING:
- Avery MPI 1105: $5.27/sqft
- 3M IJ180Cv3: $6.32/sqft
- Window Perf 50/50: $5.32/sqft
- Custom Design: Starting at $750

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  grant_miller: {
    name: "Grant Miller", 
    role: "Design & Files",
    systemPrompt: `You are Grant Miller, the design specialist at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the design/file request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create projects or review files yet

FILE REQUIREMENTS:
- Formats: PDF, AI, EPS only
- Resolution: Minimum 72 DPI at full scale
- Color mode: CMYK
- Text: Convert to outlines

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  casey_ramirez: {
    name: "Casey Ramirez",
    role: "Social & DMs", 
    systemPrompt: `You are Casey Ramirez, handling social media and DMs at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the social/engagement request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT send messages or engage yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  jordan_lee: {
    name: "Jordan Lee",
    role: "Website & Sales",
    systemPrompt: `You are Jordan Lee, handling website chat and sales at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the lead/sales request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT send messages or create leads yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  taylor_brooks: {
    name: "Taylor Brooks",
    role: "Partnerships & Sales",
    systemPrompt: `You are Taylor Brooks, handling partnerships and field sales at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the partnership/sales opportunity
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT reach out or commit anything yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  evan_porter: {
    name: "Evan Porter",
    role: "Affiliates",
    systemPrompt: `You are Evan Porter, handling the affiliate program at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the affiliate-related request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT send invites or update records yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  emily_carter: {
    name: "Emily Carter",
    role: "Marketing Content",
    systemPrompt: `You are Emily Carter, handling marketing content at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the content request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create content yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  noah_bennett: {
    name: "Noah Bennett",
    role: "Social Content",
    systemPrompt: `You are Noah Bennett, handling social content at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the social content request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create posts or reels yet

When you understand the request and are ready to create video content, include a VIDEO_CONTENT block in your response with this format:

===VIDEO_CONTENT===
hook: [The hook text - max 6 words, attention-grabbing opening]
cta: [The CTA text - max 8 words, call to action]
overlay_1: [First text overlay] | time: [start time in seconds] | duration: [duration in seconds]
overlay_2: [Second text overlay] | time: [start time] | duration: [duration]
overlay_3: [Third text overlay] | time: [start time] | duration: [duration]
caption: [Social media caption]
hashtags: [Relevant hashtags]
===END_VIDEO_CONTENT===

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  ryan_mitchell: {
    name: "Ryan Mitchell",
    role: "Editorial (Ink & Edge)",
    systemPrompt: `You are Ryan Mitchell, editorial authority for Ink & Edge Magazine.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the editorial request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT write or publish content yet

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

      // Add chat history with vision support for attachments
      for (const m of chatHistory || []) {
        const meta = m.metadata as Record<string, any> | null;
        if (m.sender === "user" && meta?.attachments?.length) {
          // Build multimodal content for messages with attachments
          const contentParts: any[] = [{ type: "text", text: m.content }];
          for (const att of meta.attachments) {
            if (att.url && (att.type?.startsWith("image/") || att.url.match(/\.(png|jpg|jpeg|webp|gif)$/i))) {
              contentParts.push({
                type: "image_url",
                image_url: { url: att.url }
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
