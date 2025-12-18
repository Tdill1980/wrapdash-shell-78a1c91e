import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCampaignRequest {
  campaignType: 'winback' | 'promotional' | 'newsletter' | 'wrapsheet' | 'test_lab';
  name: string;
  subject: string;
  previewText?: string;
  html: string;
  listId?: string;
  segmentId?: string;
  scheduleTime?: string; // ISO datetime or null for immediate
  organizationId?: string;
  offerType?: string;
  offerValue?: number;
  segmentType?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLAVIYO_API_KEY = Deno.env.get('KLAVIYO_API_KEY');
    if (!KLAVIYO_API_KEY) {
      throw new Error('KLAVIYO_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const {
      campaignType,
      name,
      subject,
      previewText,
      html,
      listId,
      segmentId,
      scheduleTime,
      organizationId,
      offerType,
      offerValue,
      segmentType
    }: CreateCampaignRequest = await req.json();

    if (!name || !subject || !html) {
      throw new Error('Missing required fields: name, subject, html');
    }

    const klaviyoHeaders = {
      'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
      'Accept': 'application/json'
    };

    console.log('Creating Klaviyo campaign:', { name, campaignType, segmentType });

    // Step 1: Create HTML Template
    console.log('Step 1: Creating template...');
    const templateResponse = await fetch('https://a.klaviyo.com/api/templates/', {
      method: 'POST',
      headers: klaviyoHeaders,
      body: JSON.stringify({
        data: {
          type: 'template',
          attributes: {
            name: `${campaignType}_${Date.now()}`,
            html: html
          }
        }
      })
    });

    if (!templateResponse.ok) {
      const errorText = await templateResponse.text();
      console.error('Template creation failed:', templateResponse.status, errorText);
      throw new Error(`Failed to create template: ${templateResponse.status} - ${errorText}`);
    }

    const templateData = await templateResponse.json();
    const templateId = templateData.data?.id;
    console.log('Template created:', templateId);

    // Step 2: Create Campaign
    console.log('Step 2: Creating campaign...');
    
    // Build audience configuration
    const audiences: { included: Array<{ type: string; id: string }> } = {
      included: []
    };

    if (segmentId) {
      audiences.included.push({ type: 'segment', id: segmentId });
    } else if (listId) {
      audiences.included.push({ type: 'list', id: listId });
    } else {
      // Default to main list - you'll need to set this in Klaviyo
      console.warn('No list or segment specified - campaign may need manual audience assignment');
    }

    const sendStrategy = scheduleTime 
      ? {
          method: 'static',
          options_static: {
            datetime: scheduleTime,
            is_local: false,
            send_past_recipients_immediately: true
          }
        }
      : {
          method: 'immediate'
        };

    const campaignPayload = {
      data: {
        type: 'campaign',
        attributes: {
          name: name,
          audiences: audiences,
          send_strategy: sendStrategy,
          send_options: {
            use_smart_sending: true
          }
        }
      }
    };

    const campaignResponse = await fetch('https://a.klaviyo.com/api/campaigns/', {
      method: 'POST',
      headers: klaviyoHeaders,
      body: JSON.stringify(campaignPayload)
    });

    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text();
      console.error('Campaign creation failed:', campaignResponse.status, errorText);
      throw new Error(`Failed to create campaign: ${campaignResponse.status} - ${errorText}`);
    }

    const campaignData = await campaignResponse.json();
    const campaignId = campaignData.data?.id;
    console.log('Campaign created:', campaignId);

    // Step 3: Get the campaign message ID
    console.log('Step 3: Getting campaign message...');
    const campaignMessagesResponse = await fetch(`https://a.klaviyo.com/api/campaigns/${campaignId}/campaign-messages`, {
      method: 'GET',
      headers: klaviyoHeaders
    });

    if (!campaignMessagesResponse.ok) {
      const errorText = await campaignMessagesResponse.text();
      console.error('Failed to get campaign messages:', campaignMessagesResponse.status, errorText);
      throw new Error(`Failed to get campaign messages: ${campaignMessagesResponse.status}`);
    }

    const messagesData = await campaignMessagesResponse.json();
    const messageId = messagesData.data?.[0]?.id;
    console.log('Campaign message ID:', messageId);

    // Step 4: Update campaign message with template and subject
    console.log('Step 4: Assigning template to campaign message...');
    const updateMessagePayload = {
      data: {
        type: 'campaign-message',
        id: messageId,
        attributes: {
          label: name,
          content: {
            subject: subject,
            preview_text: previewText || '',
            from_email: 'hello@weprintwraps.com',
            from_label: 'WePrintWraps'
          }
        },
        relationships: {
          template: {
            data: {
              type: 'template',
              id: templateId
            }
          }
        }
      }
    };

    const updateMessageResponse = await fetch(`https://a.klaviyo.com/api/campaign-messages/${messageId}`, {
      method: 'PATCH',
      headers: klaviyoHeaders,
      body: JSON.stringify(updateMessagePayload)
    });

    if (!updateMessageResponse.ok) {
      const errorText = await updateMessageResponse.text();
      console.error('Failed to update campaign message:', updateMessageResponse.status, errorText);
      // Don't throw - continue with what we have
    } else {
      console.log('Campaign message updated with template');
    }

    // Step 5: Send campaign (if immediate) or schedule it
    let sentAt = null;
    let status = 'draft';

    if (!scheduleTime) {
      console.log('Step 5: Sending campaign immediately...');
      const sendResponse = await fetch('https://a.klaviyo.com/api/campaign-send-jobs/', {
        method: 'POST',
        headers: klaviyoHeaders,
        body: JSON.stringify({
          data: {
            type: 'campaign-send-job',
            attributes: {},
            relationships: {
              campaign: {
                data: {
                  type: 'campaign',
                  id: campaignId
                }
              }
            }
          }
        })
      });

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        console.error('Failed to send campaign:', sendResponse.status, errorText);
        status = 'failed';
      } else {
        console.log('Campaign sent successfully!');
        sentAt = new Date().toISOString();
        status = 'sent';
      }
    } else {
      status = 'scheduled';
      console.log('Campaign scheduled for:', scheduleTime);
    }

    // Step 6: Record in database
    const { data: dbRecord, error: dbError } = await supabase
      .from('klaviyo_campaigns')
      .insert({
        organization_id: organizationId || null,
        klaviyo_campaign_id: campaignId,
        klaviyo_template_id: templateId,
        campaign_type: campaignType,
        name: name,
        subject: subject,
        preview_text: previewText,
        segment_type: segmentType,
        status: status,
        ai_generated: true,
        offer_type: offerType,
        offer_value: offerValue,
        html_content: html,
        scheduled_at: scheduleTime || null,
        sent_at: sentAt
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to record campaign in database:', dbError);
    }

    console.log('Campaign creation complete:', { campaignId, templateId, status });

    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        templateId,
        messageId,
        status,
        sentAt,
        dbRecord,
        message: status === 'sent' 
          ? 'Campaign created and sent successfully!' 
          : status === 'scheduled' 
            ? `Campaign scheduled for ${scheduleTime}` 
            : 'Campaign created but failed to send'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Klaviyo campaign:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
