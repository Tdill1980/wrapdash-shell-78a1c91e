import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { MapPin, Mail, Clock, AlertCircle } from "lucide-react";
import type { ChatConversation } from "@/hooks/useWebsiteChats";

// Country code to flag emoji
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface ChatTranscriptRowProps {
  conversation: ChatConversation;
  onClick: () => void;
  isSelected?: boolean;
}

export function ChatTranscriptRow({ conversation, onClick, isSelected }: ChatTranscriptRowProps) {
  const geo = conversation.metadata?.geo;
  const chatState = conversation.chat_state;
  const contact = conversation.contact;
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
  const firstUserMessage = conversation.messages?.find(m => m.direction === 'inbound');

  // Get display name
  const displayName = contact?.email && !contact.email.includes('@capture.local')
    ? contact.email
    : contact?.name || 'Anonymous Visitor';

  // Get location string
  const locationStr = geo?.city && geo?.country
    ? `${geo.city}, ${geo.country}`
    : geo?.country || 'Unknown';

  // Escalation badges
  const escalations = chatState?.escalations_sent || [];

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-muted/70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Customer info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{displayName}</span>
            {chatState?.customer_email && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Badge>
            )}
            {conversation.status === 'open' && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">
                Active
              </Badge>
            )}
          </div>

          {/* Message preview */}
          <p className="text-sm text-muted-foreground truncate mb-2">
            {firstUserMessage?.content || 'No messages'}
          </p>

          {/* Escalation tags */}
          {escalations.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {escalations.includes('jackson') && (
                <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Jackson
                </Badge>
              )}
              {escalations.includes('lance') && (
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500">
                  Lance
                </Badge>
              )}
              {escalations.includes('design') && (
                <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-500">
                  Design
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right: Location & time */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3 w-3" />
            <span>{getCountryFlag(geo?.country)}</span>
            <span className="truncate max-w-[120px]">{locationStr}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
            <Clock className="h-3 w-3" />
            {conversation.last_message_at && (
              <span title={format(new Date(conversation.last_message_at), 'PPpp')}>
                {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
              </span>
            )}
          </div>
          {conversation.messages && (
            <div className="text-xs text-muted-foreground mt-1">
              {conversation.messages.length} messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
