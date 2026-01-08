// Escalation Status Engine
// Derives completion state from events - not toggles
// Rule: "Completion is not a boolean. Completion is derived from events."

export type EscalationStatus = 'open' | 'blocked' | 'complete';

export interface ConversationEvent {
  id: string;
  conversation_id: string;
  event_type: string;
  subtype: string | null;
  actor: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface EscalationStatusResult {
  status: EscalationStatus;
  missing: string[];
  hasEscalation: boolean;
  requirements: {
    emailSent: boolean;
    quoteHandled: boolean;
    filesReviewed: boolean;
  };
  summary: string;
}

/**
 * Evaluates the completion status of an escalation based on logged events.
 * This is NON-NEGOTIABLE logic. UI cannot override it.
 * 
 * Required completion conditions:
 * 1. email_sent OR ai_response_sent (communication happened)
 * 2. quote_attached OR marked_no_quote_required (quote decision made)
 * 3. If files were uploaded: asset_reviewed OR escalation_sent:design (files handled)
 */
export function evaluateEscalationStatus(events: ConversationEvent[]): EscalationStatusResult {
  // Check for escalations first
  const hasEscalation = events.some(e => e.event_type === 'escalation_sent');
  
  if (!hasEscalation) {
    return {
      status: 'open',
      missing: [],
      hasEscalation: false,
      requirements: {
        emailSent: false,
        quoteHandled: false,
        filesReviewed: false,
      },
      summary: 'No escalation sent',
    };
  }

  // Check completion requirements
  const emailSent = events.some(e => 
    e.event_type === 'email_sent' || 
    e.event_type === 'ai_response_sent'
  );
  
  const quoteHandled = events.some(e => 
    e.event_type === 'quote_attached' || 
    e.event_type === 'quote_drafted' ||
    e.event_type === 'marked_no_quote_required'
  );
  
  const needsFileReview = events.some(e => 
    e.event_type === 'asset_uploaded' || 
    e.event_type === 'asset_review_required'
  );
  
  const filesReviewed = !needsFileReview || events.some(e => 
    e.event_type === 'asset_reviewed' || 
    (e.event_type === 'escalation_sent' && e.subtype === 'design')
  );

  // Already marked complete?
  const alreadyComplete = events.some(e => e.event_type === 'marked_complete');
  
  // Build missing requirements
  const missing: string[] = [];
  
  if (!emailSent) {
    missing.push('Email not sent');
  }
  
  if (!quoteHandled) {
    missing.push('Quote not attached or dismissed');
  }
  
  if (!filesReviewed) {
    missing.push('File not reviewed');
  }

  // Determine status
  let status: EscalationStatus;
  let summary: string;

  if (alreadyComplete) {
    status = 'complete';
    summary = 'Escalation resolved';
  } else if (missing.length === 0) {
    status = 'complete';
    summary = 'All requirements met - ready to close';
  } else {
    status = 'blocked';
    summary = `Blocked: ${missing.join(', ')}`;
  }

  return {
    status,
    missing,
    hasEscalation: true,
    requirements: {
      emailSent,
      quoteHandled,
      filesReviewed,
    },
    summary,
  };
}

/**
 * Gets a human-readable label for escalation status
 */
export function getStatusLabel(status: EscalationStatus): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'blocked':
      return 'Blocked';
    case 'complete':
      return 'Complete';
    default:
      return 'Unknown';
  }
}

/**
 * Gets CSS classes for status badge
 */
export function getStatusColor(status: EscalationStatus): string {
  switch (status) {
    case 'open':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    case 'blocked':
      return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'complete':
      return 'bg-green-500/10 text-green-500 border-green-500/30';
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
}
