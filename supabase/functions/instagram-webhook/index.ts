import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Instagram/Meta webhook verification token (set in secrets)
const VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') || 'wrapcommand_verify_token';

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET - Webhook verification (Meta sends this to verify endpoint)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('[instagram-webhook] Verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[instagram-webhook] Verification successful');
      return new Response(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    } else {
      console.log('[instagram-webhook] Verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // POST - Incoming message/event from Instagram
  if (req.method === 'POST') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const body = await req.json();
      console.log('[instagram-webhook] Received event:', JSON.stringify(body));

      // Process each entry (Meta can batch multiple events)
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const messaging = entry.messaging || [];
        
        for (const event of messaging) {
          // Only process actual messages, not echoes or reads
          if (event.message && !event.message.is_echo) {
            const senderId = event.sender?.id;
            const messageText = event.message.text || '';
            const messageId = event.message.mid;
            const timestamp = event.timestamp;
            
            // Get attachments if any (images)
            const attachments = event.message.attachments || [];
            const imageUrls = attachments
              .filter((a: any) => a.type === 'image')
              .map((a: any) => a.payload?.url);

            console.log('[instagram-webhook] Processing message:', {
              senderId,
              messageText: messageText.substring(0, 50),
              hasImages: imageUrls.length > 0
            });

            // Get sender profile from Instagram (if available)
            let senderUsername = senderId;
            
            // Log to message_ingest_log first
            await supabase.from('message_ingest_log').insert({
              platform: 'instagram',
              sender_id: senderId,
              sender_username: senderUsername,
              message_text: messageText,
              raw_payload: event,
              processed: false
            });

            // Forward to ingest-message for AI processing
            // Note: In production, you'd determine the organization_id from the receiving page
            const orgId = entry.id; // The receiving page/account ID
            
            try {
              const ingestResponse = await fetch(`${supabaseUrl}/functions/v1/ingest-message`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                  organization_id: null, // Will use default/lookup
                  platform: 'instagram',
                  sender_id: senderId,
                  sender_username: senderUsername,
                  message_text: messageText,
                  metadata: {
                    message_id: messageId,
                    timestamp,
                    images: imageUrls,
                    page_id: entry.id
                  }
                })
              });

              if (ingestResponse.ok) {
                const ingestData = await ingestResponse.json();
                console.log('[instagram-webhook] Ingest response:', ingestData);

                // If we got an AI reply, send it back to Instagram
                if (ingestData.reply) {
                  await sendInstagramReply(senderId, ingestData.reply);
                }
              }
            } catch (ingestError) {
              console.error('[instagram-webhook] Ingest error:', ingestError);
            }
          }
        }
      }

      // Instagram expects 200 OK quickly
      return new Response('EVENT_RECEIVED', { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      console.error('[instagram-webhook] Error:', error);
      // Still return 200 to prevent Meta from retrying
      return new Response('EVENT_RECEIVED', { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

// Send reply back to Instagram user
async function sendInstagramReply(recipientId: string, message: string) {
  const pageAccessToken = Deno.env.get('META_PAGE_ACCESS_TOKEN');
  
  if (!pageAccessToken) {
    console.log('[instagram-webhook] No page access token configured, skipping reply');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[instagram-webhook] Failed to send reply:', error);
    } else {
      console.log('[instagram-webhook] Reply sent successfully');
    }
  } catch (error) {
    console.error('[instagram-webhook] Send reply error:', error);
  }
}
