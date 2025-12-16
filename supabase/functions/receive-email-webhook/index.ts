import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      // Office 365 format: { emailAddress: { name: "...", address: "..." } }
      fromEmail = payload.from.emailAddress.address || '';
      fromName = payload.from.emailAddress.name || fromEmail;
    } else if (typeof payload.from_email === 'string') {
      // Already extracted format
      fromEmail = payload.from_email;
      fromName = payload.from_name || fromEmail;
    } else if (typeof payload.from === 'string') {
      // Simple string format
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
    if (toEmail.toLowerCase().includes('design@')) {
      recipientInbox = 'design';
    } else if (toEmail.toLowerCase().includes('hello@')) {
      recipientInbox = 'hello';
    } else if (toEmail.toLowerCase().includes('support@')) {
      recipientInbox = 'support';
    }

    console.log(`📬 Routing to inbox: ${recipientInbox}`);

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
      // Update last message time
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          unread_count: (existingConvo.unread_count || 0) + 1,
          subject: subject // Update subject with latest
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
        },
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error creating message:', msgError);
      throw msgError;
    }

    console.log('✅ Message saved:', message.id);
    console.log(`✅ Email from ${fromEmail} routed to MightyChat (${recipientInbox} inbox)`);

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: message.id,
      conversation_id: conversation.id,
      contact_id: contact.id,
      inbox: recipientInbox,
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
