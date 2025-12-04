import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InboundEmailPayload {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: InboundEmailPayload = await req.json();
    
    console.log("📨 Received inbound email:", {
      from: payload.from,
      subject: payload.subject?.substring(0, 50),
    });

    // Extract sender email and name
    const senderEmail = payload.from?.toLowerCase().trim();
    const senderName = payload.fromName || senderEmail?.split('@')[0] || 'Unknown';
    const content = payload.text || payload.html?.replace(/<[^>]*>/g, '') || '';
    const subject = payload.subject || 'No Subject';

    if (!senderEmail) {
      console.error("❌ No sender email in payload");
      return new Response(
        JSON.stringify({ error: "No sender email provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // WPW Organization ID
    const WPW_ORG_ID = '51aa96db-c06d-41ae-b3cb-25b045c75caf';

    // Find or create contact
    let { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("email", senderEmail)
      .eq("organization_id", WPW_ORG_ID)
      .single();

    if (contactError && contactError.code === 'PGRST116') {
      // Contact doesn't exist, create one
      console.log("📇 Creating new contact for:", senderEmail);
      const { data: newContact, error: createError } = await supabase
        .from("contacts")
        .insert({
          name: senderName,
          email: senderEmail,
          source: "email_inbound",
          organization_id: WPW_ORG_ID,
          tags: ["inbound_email"],
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Failed to create contact:", createError);
        throw new Error(`Failed to create contact: ${createError.message}`);
      }
      contact = newContact;
    } else if (contactError) {
      console.error("❌ Error finding contact:", contactError);
      throw new Error(`Failed to find contact: ${contactError.message}`);
    }

    console.log("✅ Contact found/created:", contact.id);

    // Find existing conversation or create new one
    let { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("contact_id", contact.id)
      .eq("channel", "email")
      .eq("organization_id", WPW_ORG_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (convError && convError.code === 'PGRST116') {
      // No conversation exists, create one
      console.log("💬 Creating new conversation");
      const { data: newConv, error: createConvError } = await supabase
        .from("conversations")
        .insert({
          contact_id: contact.id,
          channel: "email",
          subject: subject,
          status: "open",
          priority: "normal",
          organization_id: WPW_ORG_ID,
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select()
        .single();

      if (createConvError) {
        console.error("❌ Failed to create conversation:", createConvError);
        throw new Error(`Failed to create conversation: ${createConvError.message}`);
      }
      conversation = newConv;
    } else if (convError) {
      console.error("❌ Error finding conversation:", convError);
      throw new Error(`Failed to find conversation: ${convError.message}`);
    } else {
      // Update existing conversation
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
          status: "open",
        })
        .eq("id", conversation.id);
    }

    console.log("✅ Conversation found/created:", conversation.id);

    // Insert the inbound message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        content: content,
        channel: "email",
        direction: "inbound",
        status: "received",
        sender_name: senderName,
        sender_email: senderEmail,
        metadata: { 
          subject,
          original_html: payload.html?.substring(0, 5000),
          headers: payload.headers,
        },
      })
      .select()
      .single();

    if (messageError) {
      console.error("❌ Failed to create message:", messageError);
      throw new Error(`Failed to create message: ${messageError.message}`);
    }

    console.log("✅ Message created:", message.id);

    // Call AI priority detection
    try {
      const priorityResponse = await fetch(
        `${supabaseUrl}/functions/v1/ai-detect-priority`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ content, subject }),
        }
      );

      if (priorityResponse.ok) {
        const priorityData = await priorityResponse.json();
        console.log("🤖 AI Priority Detection:", priorityData);

        // Update conversation with detected priority and type
        if (priorityData.priority || priorityData.type) {
          await supabase
            .from("conversations")
            .update({
              priority: priorityData.priority || "normal",
              metadata: {
                ...conversation.metadata,
                message_type: priorityData.type,
                ai_extracted: priorityData.extracted,
              },
            })
            .eq("id", conversation.id);
        }
      }
    } catch (aiError) {
      console.warn("⚠️ AI priority detection failed (non-critical):", aiError);
    }

    console.log("✅ Inbound email processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        contactId: contact.id,
        conversationId: conversation.id,
        messageId: message.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("❌ Error in receive-email-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
