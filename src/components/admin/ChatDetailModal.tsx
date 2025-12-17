import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { MapPin, Mail, Phone, Clock, Globe, Car, AlertCircle, User } from "lucide-react";
import type { ChatConversation } from "@/hooks/useWebsiteChats";

function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface ChatDetailModalProps {
  conversation: ChatConversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatDetailModal({ conversation, open, onOpenChange }: ChatDetailModalProps) {
  if (!conversation) return null;

  const geo = conversation.metadata?.geo;
  const chatState = conversation.chat_state;
  const contact = conversation.contact;
  const messages = conversation.messages || [];
  const escalations = chatState?.escalations_sent || [];

  const displayName = contact?.email && !contact.email.includes('@capture.local')
    ? contact.email
    : contact?.name || 'Anonymous Visitor';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            Chat Transcript: {displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4 p-6 pt-2">
          {/* Left: Message thread */}
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">MESSAGES</h3>
            <ScrollArea className="flex-1 border border-border rounded-lg bg-muted/20 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.direction === 'inbound'
                          ? 'bg-muted'
                          : 'bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-70">
                          {msg.sender_name || (msg.direction === 'inbound' ? 'Visitor' : 'Jordan')}
                        </span>
                        {msg.created_at && (
                          <span className="text-xs opacity-50">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Info sidebar */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Customer Info */}
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {contact?.email && !contact.email.includes('@capture.local') && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {chatState?.vehicle && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {chatState.vehicle.year} {chatState.vehicle.make} {chatState.vehicle.model}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {conversation.created_at && format(new Date(conversation.created_at), 'PPp')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Geo Location */}
            {geo && (geo.city || geo.country) && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCountryFlag(geo.country)}</span>
                    <div>
                      <div className="font-medium">
                        {geo.city && `${geo.city}, `}
                        {geo.region && `${geo.region}, `}
                        {geo.country_name || geo.country}
                      </div>
                      {geo.timezone && (
                        <div className="text-xs text-muted-foreground">{geo.timezone}</div>
                      )}
                    </div>
                  </div>
                  {geo.ip && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span>IP: {geo.ip}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Escalations */}
            {escalations.length > 0 && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Escalations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {escalations.map((esc) => (
                    <Badge
                      key={esc}
                      variant="outline"
                      className={`text-xs ${
                        esc === 'jackson'
                          ? 'bg-red-500/10 text-red-500'
                          : esc === 'lance'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-purple-500/10 text-purple-500'
                      }`}
                    >
                      {esc === 'jackson' && 'Jackson (Operations)'}
                      {esc === 'lance' && 'Lance (Graphics)'}
                      {esc === 'design' && 'Design Team'}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Chat State */}
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Chat State</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-xs">
                  Stage: {chatState?.stage || 'initial'}
                </Badge>
              </CardContent>
            </Card>

            {/* Page URL */}
            {conversation.metadata?.page_url && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Source Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={conversation.metadata.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {conversation.metadata.page_url}
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
