import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  AlertCircle, 
  Mail, 
  FileText, 
  Upload, 
  CheckCircle, 
  MessageSquare,
  ChevronDown,
  User,
  Bot
} from "lucide-react";
import { useState } from "react";
import type { ConversationEvent } from "@/hooks/useConversationEvents";

interface EscalationTimelineProps {
  events: ConversationEvent[];
  isLoading?: boolean;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  escalation_sent: <AlertCircle className="h-4 w-4" />,
  email_sent: <Mail className="h-4 w-4" />,
  email_drafted: <Mail className="h-4 w-4" />,
  quote_attached: <FileText className="h-4 w-4" />,
  quote_drafted: <FileText className="h-4 w-4" />,
  marked_no_quote_required: <FileText className="h-4 w-4" />,
  asset_uploaded: <Upload className="h-4 w-4" />,
  asset_reviewed: <CheckCircle className="h-4 w-4" />,
  asset_review_required: <Upload className="h-4 w-4" />,
  marked_complete: <CheckCircle className="h-4 w-4" />,
  internal_note: <MessageSquare className="h-4 w-4" />,
  ai_response: <Bot className="h-4 w-4" />,
  ai_response_sent: <Bot className="h-4 w-4" />,
};

const EVENT_COLORS: Record<string, string> = {
  escalation_sent: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  email_sent: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  email_drafted: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  quote_attached: "bg-green-500/10 text-green-500 border-green-500/30",
  quote_drafted: "bg-green-500/10 text-green-400 border-green-500/30",
  marked_no_quote_required: "bg-muted text-muted-foreground border-muted",
  asset_uploaded: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  asset_reviewed: "bg-green-500/10 text-green-500 border-green-500/30",
  asset_review_required: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  marked_complete: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  internal_note: "bg-muted text-muted-foreground border-muted",
  ai_response: "bg-primary/10 text-primary border-primary/30",
  ai_response_sent: "bg-primary/10 text-primary border-primary/30",
};

const SUBTYPE_LABELS: Record<string, string> = {
  jackson: "Jackson (Operations)",
  lance: "Lance (Graphics)",
  design: "Design Team",
  bulk: "Bulk/Fleet",
  quality_issue: "Quality Issue",
  unhappy: "Customer Concern",
};

function getEventTitle(event: ConversationEvent): string {
  switch (event.event_type) {
    case 'escalation_sent':
      return `Escalation: ${SUBTYPE_LABELS[event.subtype || ''] || event.subtype || 'General'}`;
    case 'email_sent':
      return 'Email Sent';
    case 'email_drafted':
      return 'Email Drafted';
    case 'quote_attached':
      return `Quote Attached: ${event.payload.quote_number || 'Quote'}`;
    case 'quote_drafted':
      return `Quote Drafted: ${event.payload.quote_number || 'Quote'}`;
    case 'marked_no_quote_required':
      return 'Quote Not Required';
    case 'asset_uploaded':
      return `File Uploaded: ${event.payload.filename || 'File'}`;
    case 'asset_reviewed':
      return 'File Reviewed';
    case 'asset_review_required':
      return 'File Review Required';
    case 'marked_complete':
      return 'Escalation Complete';
    case 'internal_note':
      return 'Internal Note';
    case 'ai_response':
    case 'ai_response_sent':
      return 'AI Response';
    default:
      return event.event_type.replace(/_/g, ' ');
  }
}

function getActorLabel(actor: string): { label: string; icon: React.ReactNode } {
  switch (actor) {
    case 'jordan_lee':
      return { label: 'Jordan Lee AI', icon: <Bot className="h-3 w-3" /> };
    case 'system':
      return { label: 'System', icon: <CheckCircle className="h-3 w-3" /> };
    case 'admin':
    case 'human':
      return { label: 'Admin', icon: <User className="h-3 w-3" /> };
    default:
      return { label: actor, icon: <User className="h-3 w-3" /> };
  }
}

function EventCard({ event }: { event: ConversationEvent }) {
  const [isOpen, setIsOpen] = useState(false);
  const colorClass = EVENT_COLORS[event.event_type] || EVENT_COLORS.internal_note;
  const icon = EVENT_ICONS[event.event_type] || <MessageSquare className="h-4 w-4" />;
  const actorInfo = getActorLabel(event.actor);
  const hasExpandableContent = event.event_type === 'email_sent' && event.payload.email_body;

  return (
    <div className={`relative pl-6 pb-4 border-l-2 ${colorClass.split(' ')[2] || 'border-muted'}`}>
      {/* Timeline dot */}
      <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>

      <div className={`ml-4 p-3 rounded-lg border ${colorClass}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm">{getEventTitle(event)}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(event.created_at), 'MMM d, h:mm a')}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {actorInfo.icon}
          <span>{actorInfo.label}</span>
        </div>

        {/* Event-specific details */}
        {event.event_type === 'escalation_sent' && event.payload.message_excerpt && (
          <p className="text-xs text-muted-foreground italic mt-2 p-2 bg-muted/30 rounded">
            "{event.payload.message_excerpt}"
          </p>
        )}

        {event.event_type === 'email_sent' && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="mt-2 space-y-1 text-xs">
              {event.payload.email_sent_to && (
                <p><span className="text-muted-foreground">To:</span> {event.payload.email_sent_to.join(', ')}</p>
              )}
              {event.payload.email_subject && (
                <p><span className="text-muted-foreground">Subject:</span> {event.payload.email_subject}</p>
              )}
            </div>
            {hasExpandableContent && (
              <>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                  <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  {isOpen ? 'Hide email body' : 'Show email body'}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div 
                    className="mt-2 p-3 bg-muted/30 rounded text-xs max-h-40 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: event.payload.email_body || '' }}
                  />
                </CollapsibleContent>
              </>
            )}
          </Collapsible>
        )}

        {event.event_type === 'asset_uploaded' && event.payload.file_url && (
          <a 
            href={event.payload.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            ⬇️ Download File
          </a>
        )}

        {event.event_type === 'quote_attached' && event.payload.quote_number && (
          <Badge variant="secondary" className="text-xs mt-2">
            Quote #{event.payload.quote_number}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function EscalationTimeline({ events, isLoading }: EscalationTimelineProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Loading timeline...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No events recorded yet</p>
        <p className="text-xs mt-1">Escalations, emails, and quotes will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="pt-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </ScrollArea>
  );
}
