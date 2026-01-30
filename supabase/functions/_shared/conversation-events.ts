// Conversation Events Logger - The OS Spine
// This is the SINGLE allowed way to write events to conversation_events
// Rule: "If an action does not write an event, the action is invalid."

export type ConversationEventType = 
  | 'message_received'
  | 'escalation_sent'
  | 'escalation_blocked'
  | 'email_sent'
  | 'email_drafted'
  | 'ai_response_sent'
  | 'quote_drafted'
  | 'quote_attached'
  | 'marked_no_quote_required'
  | 'asset_uploaded'
  | 'asset_review_required'
  | 'asset_reviewed'
  | 'marked_complete'
  | 'classification_completed'
  | 'call_requested'
  | 'call_scheduled'
  | 'call_completed'
  | 'failed';

export interface EventPayload {
  // Email-related
  email_sent_to?: string[];
  email_sent_at?: string;
  email_subject?: string;
  email_body?: string;
  
  // Message context
  message_excerpt?: string;
  trigger_keywords?: string[];
  
  // Customer info
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  shop_name?: string;
  
  // Order/Quote info
  order_number?: string;
  quote_id?: string;
  quote_number?: string;
  quote_total?: number;
  
  // Bulk/Fleet info
  bulk_vehicle_count?: string;
  bulk_vehicle_types?: string;
  
  // File/Asset info
  file_url?: string;
  filename?: string;
  file_type?: string;
  
  // Escalation info
  priority?: string;
  reason?: string;
  escalation_target?: string;
  escalation_type?: string;
  target?: string;
  was_pending?: boolean;
  pending_since?: string;
  has_name?: boolean;
  has_email?: boolean;
  has_phone?: boolean;
  
  // Error tracking
  error?: string;
  
  // Flexible metadata
  metadata?: Record<string, unknown>;
}

export interface LogEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Logs a conversation event to the conversation_events table.
 * This is the ONLY way to record events - all actions must use this function.
 * 
 * @param supabase - Supabase client (service role)
 * @param conversationId - The conversation this event belongs to
 * @param eventType - Type of event (escalation_sent, email_sent, etc.)
 * @param actor - Who performed the action (jordan_lee, system, human)
 * @param payload - Event details (email body, recipients, etc.)
 * @param subtype - Optional subtype (jackson, lance, design, bulk, etc.)
 */
export async function logConversationEvent(
  supabase: any,
  conversationId: string,
  eventType: ConversationEventType,
  actor: string,
  payload: EventPayload,
  subtype?: string
): Promise<LogEventResult> {
  try {
    // Validate required fields
    if (!conversationId) {
      console.error('[ConversationEvents] Missing conversationId');
      return { success: false, error: 'Missing conversationId' };
    }

    if (!eventType) {
      console.error('[ConversationEvents] Missing eventType');
      return { success: false, error: 'Missing eventType' };
    }

    // Clean payload - remove undefined values
    const cleanPayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        cleanPayload[key] = value;
      }
    }

    // Insert event
    const { data, error } = await supabase
      .from('conversation_events')
      .insert({
        conversation_id: conversationId,
        event_type: eventType,
        subtype: subtype || null,
        actor: actor,
        payload: cleanPayload,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ConversationEvents] Insert error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[ConversationEvents] Logged ${eventType}${subtype ? `:${subtype}` : ''} for conversation ${conversationId.substring(0, 8)}...`);
    
    return { success: true, eventId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ConversationEvents] Unexpected error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Logs an escalation event with email receipt.
 * Convenience wrapper for the common pattern of sending an escalation + email.
 */
export async function logEscalationWithEmail(
  supabase: any,
  conversationId: string,
  escalationType: string,
  emailDetails: {
    recipients: string[];
    subject: string;
    body: string;
    sentAt: string;
  },
  context: {
    customerEmail?: string;
    customerName?: string;
    messageExcerpt?: string;
    orderNumber?: string;
  }
): Promise<{ escalationResult: LogEventResult; emailResult: LogEventResult }> {
  // Log the escalation event
  const escalationResult = await logConversationEvent(
    supabase,
    conversationId,
    'escalation_sent',
    'jordan_lee',
    {
      customer_email: context.customerEmail,
      customer_name: context.customerName,
      message_excerpt: context.messageExcerpt,
      order_number: context.orderNumber,
      escalation_target: escalationType,
      priority: 'high',
    },
    escalationType
  );

  // Log the email receipt
  const emailResult = await logConversationEvent(
    supabase,
    conversationId,
    'email_sent',
    'jordan_lee',
    {
      email_sent_to: emailDetails.recipients,
      email_sent_at: emailDetails.sentAt,
      email_subject: emailDetails.subject,
      email_body: emailDetails.body.substring(0, 2000), // Limit body size
      customer_email: context.customerEmail,
      customer_name: context.customerName,
    },
    escalationType
  );

  return { escalationResult, emailResult };
}

/**
 * Logs a quote event (drafted or attached).
 */
export async function logQuoteEvent(
  supabase: any,
  conversationId: string,
  eventType: 'quote_drafted' | 'quote_attached',
  quoteDetails: {
    quoteId: string;
    quoteNumber: string;
    total?: number;
    customerEmail?: string;
    customerName?: string;
    vehicleInfo?: string;
  },
  actor: string = 'jordan_lee'
): Promise<LogEventResult> {
  return logConversationEvent(
    supabase,
    conversationId,
    eventType,
    actor,
    {
      quote_id: quoteDetails.quoteId,
      quote_number: quoteDetails.quoteNumber,
      quote_total: quoteDetails.total,
      customer_email: quoteDetails.customerEmail,
      customer_name: quoteDetails.customerName,
      metadata: quoteDetails.vehicleInfo ? { vehicle: quoteDetails.vehicleInfo } : undefined,
    }
  );
}
