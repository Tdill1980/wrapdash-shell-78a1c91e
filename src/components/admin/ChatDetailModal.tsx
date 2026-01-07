import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { MapPin, Mail, Phone, Clock, Globe, Car, AlertCircle, User, MessageSquare, FileText, Download } from "lucide-react";
import type { ChatConversation } from "@/hooks/useWebsiteChats";
import { useConversationEvents } from "@/hooks/useConversationEvents";
import { EscalationTimeline } from "./EscalationTimeline";
import { EmailReceiptViewer } from "./EmailReceiptViewer";

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
  const { data: events, isLoading: eventsLoading } = useConversationEvents(conversation?.id || null);
  
  if (!conversation) return null;

  const geo = conversation.metadata?.geo;
  const chatState = conversation.chat_state;
  const contact = conversation.contact;
  const messages = conversation.messages || [];
  const escalations = chatState?.escalations_sent || [];

  // Separate events by type
  const escalationEvents = events?.filter(e => e.event_type === 'escalation_sent') || [];
  const emailEvents = events?.filter(e => e.event_type === 'email_sent') || [];
  const assetEvents = events?.filter(e => e.event_type === 'asset_uploaded') || [];

  const displayName = contact?.email && !contact.email.includes('@capture.local')
    ? contact.email
    : contact?.name || 'Anonymous Visitor';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              Chat: {displayName}
            </div>
            <div className="flex items-center gap-2">
              {escalations.length > 0 && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {escalations.length} Escalation{escalations.length > 1 ? 's' : ''}
                </Badge>
              )}
              {emailEvents.length > 0 && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                  <Mail className="h-3 w-3 mr-1" />
                  {emailEvents.length} Email{emailEvents.length > 1 ? 's' : ''} Sent
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4 p-6 pt-2">
          {/* Left: Tabbed content area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Tabs defaultValue="transcript" className="flex-1 flex flex-col">
              <TabsList className="mb-3">
                <TabsTrigger value="transcript" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Transcript ({messages.length})
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Timeline ({events?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="emails" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Emails ({emailEvents.length})
                </TabsTrigger>
                <TabsTrigger value="assets" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Assets ({assetEvents.length})
                </TabsTrigger>
              </TabsList>

              {/* Transcript Tab */}
              <TabsContent value="transcript" className="flex-1 mt-0">
                <ScrollArea className="h-[calc(90vh-200px)] border border-border rounded-lg bg-muted/20 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages recorded
                      </div>
                    ) : (
                      messages.map((msg) => (
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
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="flex-1 mt-0">
                <EscalationTimeline events={events || []} isLoading={eventsLoading} />
              </TabsContent>

              {/* Emails Tab */}
              <TabsContent value="emails" className="flex-1 mt-0">
                <EmailReceiptViewer emailEvents={emailEvents} />
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets" className="flex-1 mt-0">
                {assetEvents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No assets uploaded</p>
                    <p className="text-xs mt-1">Customer uploads will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-2 gap-3">
                      {assetEvents.map((event) => (
                        <Card key={event.id} className="bg-card/50">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/10">
                                <FileText className="h-5 w-5 text-purple-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {event.payload.filename || 'File'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(event.created_at), 'MMM d, h:mm a')}
                                </p>
                              </div>
                              {event.payload.file_url && (
                                <a
                                  href={event.payload.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                                >
                                  <Download className="h-4 w-4 text-primary" />
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Info sidebar */}
          <div className="w-72 flex-shrink-0 space-y-4 overflow-auto">
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

            {/* Escalations Summary */}
            {escalations.length > 0 && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Escalations Sent
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
                      {!['jackson', 'lance', 'design'].includes(esc) && esc}
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
