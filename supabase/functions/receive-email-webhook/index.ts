// supabase/functions/receive-email-webhook/index.ts
// Email webhook with MCP agent routing: Alex (hello@), Grant (design@), Jackson (ops_desk)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { WPW_CONSTITUTION } from "../_shared/wpw-constitution.ts";
import { AGENTS } from "../_shared/agent-config.ts";
import { routeToOpsDesk } from "../_shared/ops-desk-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map inbox to assigned agent
const INBOX_AGENT_MAP: Record<string, string> = {
  hello: 'alex_morgan',      // Quoting & follow-up
  design: 'grant_miller',    // Design file review
  jackson: 'ops_desk',       // Direct to operations
  support: 'alex_morgan',    // Support routes to Alex
  general: 'alex_morgan',    // Default to Alex
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('📨 Raw payload received:', JSON.stringify(payload, null, 2));

    // Extract from email - handle both Office 365 object format and simple string
    let fromEmail: string;
    let fromName: string;
    
    if (typeof payload.from === 'object' && payload.from?.emailAddress) {
      fromEmail = payload.from.emailAddress.address || '';
      fromName = payload.from.emailAddress.name || fromEmail;
    } else if (typeof payload.from_email === 'string') {
      fromEmail = payload.from_email;
      fromName = payload.from_name || fromEmail;
    } else if (typeof payload.from === 'string') {
      fromEmail = payload.from;
      fromName = payload.from_name || fromEmail;
    } else {
      console.error('❌ Could not extract from email from payload:', payload);
      return new Response(JSON.stringify({ error: 'Invalid from field format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const toEmail = payload.to_email || payload.to || 'unknown@weprintwraps.com';
    const subject = payload.subject || '(No Subject)';
    const body = payload.body || payload.bodyPreview || '';
    const messageId = payload.message_id || payload.id || `email-${Date.now()}`;

    console.log('📧 Parsed email:', { fromEmail, fromName, toEmail, subject: subject.substring(0, 50) });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // WPW organization ID
    const WPW_ORG_ID = '51aa96db-c06d-41ae-b3cb-25b045c75caf';

    // Determine recipient inbox based on to_email
    let recipientInbox = 'general';
    const toEmailLower = String(toEmail || '').toLowerCase();

    if (toEmailLower.includes('design@')) {
      recipientInbox = 'design';
    } else if (toEmailLower.includes('hello@')) {
      recipientInbox = 'hello';
    } else if (toEmailLower.includes('jackson@')) {
      recipientInbox = 'jackson';
    } else if (toEmailLower.includes('support@')) {
      recipientInbox = 'support';
    }

    // Get assigned agent for this inbox
    const assignedAgent = INBOX_AGENT_MAP[recipientInbox] || 'alex_morgan';
    const agentConfig = AGENTS[assignedAgent];
    
    console.log(`📬 Routing to inbox: ${recipientInbox} → Agent: ${agentConfig?.displayName || assignedAgent}`);

    // Detect intent signals for task prioritization
    const emailContent = `${subject} ${body}`.toLowerCase();
    const pricingIntent = emailContent.includes('price') || emailContent.includes('quote') || emailContent.includes('cost') || emailContent.includes('how much');
    const designIntent = emailContent.includes('design') || emailContent.includes('proof') || emailContent.includes('file') || emailContent.includes('artwork');
    const partnershipIntent = emailContent.includes('partner') || emailContent.includes('collab') || emailContent.includes('sponsor') || emailContent.includes('wholesale');
    const urgentIntent = emailContent.includes('urgent') || emailContent.includes('asap') || emailContent.includes('rush');

    // Calculate revenue impact
    let revenueImpact: 'high' | 'medium' | 'low' = 'medium';
    if (partnershipIntent || urgentIntent) {
      revenueImpact = 'high';
    } else if (pricingIntent) {
      revenueImpact = 'medium';
    }

    // Find or create contact
    let contact;
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', fromEmail.toLowerCase())
      .eq('organization_id', WPW_ORG_ID)
      .maybeSingle();

    if (existingContact) {
      contact = existingContact;
      console.log('👤 Found existing contact:', contact.id);
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          email: fromEmail.toLowerCase(),
          name: fromName,
          organization_id: WPW_ORG_ID,
          source: 'email',
        })
        .select()
        .single();

      if (contactError) {
        console.error('❌ Error creating contact:', contactError);
        throw contactError;
      }
      contact = newContact;
      console.log('👤 Created new contact:', contact.id);
    }

    // Find or create conversation
    let conversation;
    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('channel', 'email')
      .eq('recipient_inbox', recipientInbox)
      .eq('status', 'open')
      .maybeSingle();

    if (existingConvo) {
      conversation = existingConvo;
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          unread_count: (existingConvo.unread_count || 0) + 1,
          subject: subject,
          // Store agent assignment in metadata instead of assigned_to (expects UUID)
          metadata: {
            ...(existingConvo.metadata || {}),
            assigned_agent: assignedAgent,
          },
        })
        .eq('id', existingConvo.id);
      console.log('💬 Updated existing conversation:', conversation.id);
    } else {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          channel: 'email',
          status: 'open',
          organization_id: WPW_ORG_ID,
          subject: subject,
          recipient_inbox: recipientInbox,
          // Store agent assignment in metadata instead of assigned_to (expects UUID)
          metadata: {
            assigned_agent: assignedAgent,
          },
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select()
        .single();

      if (convoError) {
        console.error('❌ Error creating conversation:', convoError);
        throw convoError;
      }
      conversation = newConvo;
      console.log('💬 Created new conversation:', conversation.id);
    }

    // Insert the message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'inbound',
        content: body,
        sender_name: fromName,
        sender_email: fromEmail,
        channel: 'email',
        metadata: {
          subject: subject,
          message_id: messageId,
          to_email: toEmail,
          recipient_inbox: recipientInbox,
          assigned_agent: assignedAgent,
        },
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error creating message:', msgError);
      throw msgError;
    }

    console.log('✅ Message saved:', message.id);

    // Route to Ops Desk for task creation based on inbox
    let taskDescription = '';
    let taskTarget = assignedAgent;

    if (recipientInbox === 'hello' || recipientInbox === 'support' || recipientInbox === 'general') {
      // Alex handles quoting and general inquiries
      if (pricingIntent) {
        taskDescription = `Quote request via email: ${subject}`;
      } else {
        taskDescription = `Email inquiry: ${subject}`;
      }
    } else if (recipientInbox === 'design') {
      // Grant handles design
      taskDescription = `Design email: ${subject}`;
      if (designIntent) {
        taskDescription = `Design file/proof request: ${subject}`;
      }
    } else if (recipientInbox === 'jackson') {
      // Direct to ops - high priority
      taskDescription = `Operations email (direct to Jackson): ${subject}`;
      revenueImpact = 'high';
    }

    // Partnership signals get routed to Taylor Brooks
    if (partnershipIntent) {
      taskTarget = 'taylor_brooks';
      taskDescription = `Partnership/sponsorship inquiry: ${subject}`;
      revenueImpact = 'high';
    }

    // Create task through Ops Desk
    try {
      await routeToOpsDesk(supabase, {
        action: 'create_task',
        requested_by: assignedAgent,
        target: taskTarget,
        context: {
          description: taskDescription,
          customer: fromName,
          revenue_impact: revenueImpact,
          notes: `From: ${fromEmail}\nSubject: ${subject}\nInbox: ${recipientInbox}\nConversation: ${conversation.id}`,
        },
      });
      console.log(`📋 Task created for ${taskTarget}: ${taskDescription}`);
    } catch (taskError) {
      console.error('⚠️ Task creation failed (non-blocking):', taskError);
      // Don't fail the webhook for task creation errors
    }

    console.log(`✅ Email from ${fromEmail} routed to ${agentConfig?.displayName || assignedAgent} (${recipientInbox} inbox)`);

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: message.id,
      conversation_id: conversation.id,
      contact_id: contact.id,
      inbox: recipientInbox,
      assigned_agent: assignedAgent,
      agent_name: agentConfig?.displayName,
      revenue_impact: revenueImpact,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('❌ Error in receive-email-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
