import { useMemo } from "react";
import type { ConversationEvent } from "./useConversationEvents";

export type EscalationStatus = 'open' | 'blocked' | 'complete';

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
  canMarkComplete: boolean;
}

/**
 * Evaluates escalation status from events.
 * Mirror of server-side logic for UI display.
 * Rule: "Completion is derived from events, not toggles."
 */
export function evaluateEscalationStatus(events: ConversationEvent[]): EscalationStatusResult {
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
      canMarkComplete: false,
    };
  }

  const emailSent = events.some(e => 
    e.event_type === 'email_sent' || 
    e.event_type === 'ai_response_sent' ||
    e.event_type === 'outbound_message_sent'
  );
  
  const quoteHandled = events.some(e => 
    e.event_type === 'quote_attached' || 
    e.event_type === 'quote_drafted' ||
    e.event_type === 'quote_provided' ||
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

  const alreadyComplete = events.some(e => e.event_type === 'marked_complete' || e.event_type === 'resolved');
  
  // Check for call requested (escalation is being worked on)
  const callRequested = events.some(e => e.event_type === 'call_requested');
  
  // Check if marked as ongoing (still needs follow-up)
  const markedOngoing = events.some(e => e.event_type === 'marked_ongoing');
  
  const missing: string[] = [];
  
  if (!emailSent) missing.push('Email not sent');
  if (!quoteHandled) missing.push('Quote not attached or dismissed');
  if (!filesReviewed) missing.push('File not reviewed');

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
    canMarkComplete: missing.length === 0 && !alreadyComplete,
  };
}

export function getStatusLabel(status: EscalationStatus): string {
  switch (status) {
    case 'open': return 'Open';
    case 'blocked': return 'Blocked';
    case 'complete': return 'Complete';
    default: return 'Unknown';
  }
}

export function getStatusColor(status: EscalationStatus): string {
  switch (status) {
    case 'open': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    case 'blocked': return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'complete': return 'bg-green-500/10 text-green-500 border-green-500/30';
    default: return 'bg-muted text-muted-foreground border-muted';
  }
}

/**
 * Hook to evaluate escalation status from events
 */
export function useEscalationStatus(events: ConversationEvent[] | undefined) {
  return useMemo(() => {
    if (!events || events.length === 0) {
      return {
        status: 'open' as EscalationStatus,
        missing: [],
        hasEscalation: false,
        requirements: {
          emailSent: false,
          quoteHandled: false,
          filesReviewed: false,
        },
        summary: 'No events',
        canMarkComplete: false,
      };
    }
    return evaluateEscalationStatus(events);
  }, [events]);
}
