import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format, differenceInMinutes, differenceInSeconds } from "date-fns";
import { MapPin, Mail, Clock, AlertCircle, Download, MessageSquare, Globe, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Format duration
function formatDuration(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return "—";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const mins = differenceInMinutes(end, start);
  const secs = differenceInSeconds(end, start) % 60;
  return `${mins}m ${secs}s`;
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
  const sessionId = conversation.metadata?.session_id || conversation.id.slice(0, 12);
  const messageCount = conversation.messages?.length || 0;
  
  // Calculate duration from first to last message
  const firstMsg = conversation.messages?.[0];
  const lastMsg = conversation.messages?.[conversation.messages?.length - 1];
  const duration = formatDuration(firstMsg?.created_at || null, lastMsg?.created_at || null);

  // Get display name
  const displayName = contact?.email && !contact.email.includes('@capture.local')
    ? contact.email
    : contact?.name || 'Anonymous Visitor';

  // Get full location string
  const locationStr = geo?.city && geo?.region && geo?.country
    ? `${geo.city}, ${geo.region} (${geo.country})`
    : geo?.city && geo?.country
    ? `${geo.city} (${geo.country})`
    : geo?.country_name || geo?.country || 'Unknown Location';

  // Escalation badges
  const escalations = chatState?.escalations_sent || [];

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const data = {
      session_id: sessionId,
      customer: displayName,
      location: locationStr,
      created_at: conversation.created_at,
      messages: conversation.messages
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-session-${sessionId}.json`;
    a.click();
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg mb-3 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-primary/10 border-primary ring-1 ring-primary/30' 
          : 'bg-card hover:bg-muted/50 border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Session info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Session ID header */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Channel badge */}
            {conversation.channel === 'instagram' ? (
              <Badge variant="outline" className="text-xs bg-pink-500/10 text-pink-600 border-pink-500/30">
                <Instagram className="h-3 w-3 mr-1" />
                Instagram
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                <Globe className="h-3 w-3 mr-1" />
                Website
              </Badge>
            )}
            <span className="font-semibold">Session {sessionId}</span>
            {chatState?.customer_email && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                <Mail className="h-3 w-3 mr-1" />
                Email Captured
              </Badge>
            )}
            {conversation.status === 'open' && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Active
              </Badge>
            )}
          </div>

          {/* DateTime */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {conversation.created_at && (
              <span>{format(new Date(conversation.created_at), 'M/d/yyyy, h:mm:ss a')}</span>
            )}
          </div>

          {/* Message count */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{messageCount} messages</span>
          </div>

          {/* Geolocation */}
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">{locationStr}</span>
          </div>

          {/* Duration */}
          <div className="text-sm text-muted-foreground">
            Duration: {duration}
          </div>

          {/* Escalation tags */}
          {escalations.length > 0 && (
            <div className="flex gap-1 flex-wrap pt-1">
              {escalations.includes('jackson') && (
                <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Jackson
                </Badge>
              )}
              {escalations.includes('lance') && (
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                  Lance
                </Badge>
              )}
              {escalations.includes('design') && (
                <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600">
                  Design
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right: Download button */}
        <div className="flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}