import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, RefreshCw } from "lucide-react";
import { ChannelBadge, ChannelIcon } from "@/components/mightychat/ChannelBadge";
import { ContactSidebar } from "@/components/mightychat/ContactSidebar";
import { WorkStreamsSidebar, type WorkStream, mapStreamToInbox } from "@/components/mightychat/WorkStreamsSidebar";
import { ConversationContextHeader } from "@/components/mightychat/ConversationContextHeader";
import { ThreadScopeBanner, DisabledReplyBox } from "@/components/mightychat/ThreadScopeLabel";
import { ConversationActionsBar } from "@/components/mightychat/ConversationActionsBar";
import { AgentBadge, QuoteStatusBadge } from "@/components/mightychat/InboxFilters";
import { useMightyPermissions, isExternalConversation, getExternalHandler } from "@/hooks/useMightyPermissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AgentInbox } from "@/components/mightychat/AgentInboxTabs";

interface Conversation {
  id: string;
  channel: string;
  subject: string | null;
  status: string | null;
  priority: string | null;
  unread_count: number | null;
  last_message_at: string | null;
  contact_id: string | null;
  recipient_inbox?: string | null;
  review_status?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface Message {
  id: string;
  content: string;
  direction: string;
  channel: string;
  created_at: string | null;
  sender_name: string | null;
  metadata: {
    avatar_url?: string;
    username?: string;
  } | null;
}

interface AgentMightyChatLayoutProps {
  onOpenOpsDesk: () => void;
}

export function AgentMightyChatLayout({ onOpenOpsDesk }: AgentMightyChatLayoutProps) {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("id");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<WorkStream>('website');
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const permissions = useMightyPermissions();

  // Map stream to AgentInbox for permission checks
  const activeInbox: AgentInbox = mapStreamToInbox(activeStream) as AgentInbox;

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadConversation(selectedId);
    }
  }, [selectedId, conversations]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false });
    
    if (!error && data) {
      setConversations(data as unknown as Conversation[]);
    }
    setLoading(false);
  };

  const loadConversation = async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setSelectedConversation(conv);
      
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      
      if (msgs) {
        setMessages(msgs as Message[]);
      }

      await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", id);
    }
  };

  // Map conversation to stream
  const getConversationStream = (conv: Conversation): WorkStream => {
    if (conv.channel === 'website') return 'website';
    if (conv.channel === 'instagram') return 'dms';
    if (conv.channel === 'email') {
      if (conv.recipient_inbox?.includes('design')) return 'design';
      if (conv.recipient_inbox?.includes('jackson')) return 'ops';
      return 'quotes'; // hello inbox = quotes waiting
    }
    return 'website';
  };

  // Filter conversations based on active stream
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const stream = getConversationStream(conv);
      return stream === activeStream;
    });
  }, [conversations, activeStream]);

  // Compute stream counts
  const streamCounts = useMemo(() => ({
    website: conversations.filter(c => c.channel === 'website').length,
    quotes: conversations.filter(c => c.channel === 'email' && (!c.recipient_inbox || c.recipient_inbox?.includes('hello'))).length,
    design: conversations.filter(c => c.channel === 'email' && c.recipient_inbox?.includes('design')).length,
    dms: conversations.filter(c => c.channel === 'instagram').length,
    ops: conversations.filter(c => c.channel === 'email' && c.recipient_inbox?.includes('jackson')).length
  }), [conversations]);

  // Clear selection if not in current stream
  useEffect(() => {
    if (selectedConversation && !filteredConversations.some(c => c.id === selectedConversation.id)) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [activeStream, filteredConversations, selectedConversation]);

  const isExternal = selectedConversation ? isExternalConversation(selectedConversation.channel) : false;
  const canReply = permissions.canReplyExternal(activeInbox) || !isExternal;

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      default: return "bg-muted";
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getMessageAvatar = (msg: Message) => {
    const metadata = msg.metadata || {};
    return metadata.avatar_url || null;
  };

  const getMessageInitials = (msg: Message) => {
    const name = msg.sender_name || "?";
    if (name.startsWith("@")) {
      return name.slice(1, 3).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleBackfillProfiles = async () => {
    setBackfillLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-instagram-profiles");
      if (error) throw error;
      toast.success(`Updated ${data.updated} of ${data.total} Instagram contacts`);
      loadConversations();
    } catch (err) {
      console.error("Backfill error:", err);
      toast.error("Failed to backfill Instagram profiles");
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !canReply) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      const { data: contact } = await supabase
        .from("contacts")
        .select("metadata")
        .eq("id", selectedConversation.contact_id)
        .single();

      const instagramSenderId = (contact?.metadata as any)?.instagram_sender_id;

      if (selectedConversation.channel === "instagram" && instagramSenderId) {
        const { error } = await supabase.functions.invoke("send-instagram-reply", {
          body: { recipient: instagramSenderId, message: messageText }
        });
        if (error) throw error;
      }

      const { data: savedMsg, error: dbError } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          channel: selectedConversation.channel,
          content: messageText,
          direction: "outbound",
          status: "sent",
          sender_name: "You"
        })
        .select()
        .single();

      if (dbError) throw dbError;

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);

      if (savedMsg) {
        setMessages(prev => [...prev, savedMsg as Message]);
      }

      if (selectedConversation.channel === "instagram") {
        toast.success("Reply sent via Instagram DM");
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Mighty<span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>™
          </h1>
          <p className="text-muted-foreground text-sm">Work Streams • Focus Mode</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleBackfillProfiles}
          disabled={backfillLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${backfillLoading ? "animate-spin" : ""}`} />
          {backfillLoading ? "Updating..." : "Refresh IG Profiles"}
        </Button>
      </div>

      {/* Main 3-column layout with sidebar */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* LEFT: Work Streams Sidebar */}
        <WorkStreamsSidebar
          activeStream={activeStream}
          onStreamChange={setActiveStream}
          onOpenOpsDesk={onOpenOpsDesk}
          counts={streamCounts}
        />

        {/* CENTER: Conversation List + Thread */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Conversation List */}
          <Card className="w-[280px] flex-shrink-0 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Conversations</span>
                <Badge variant="outline" className="text-xs">
                  {filteredConversations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="p-4 text-muted-foreground">Loading...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-muted-foreground text-center">
                    No conversations in this stream
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const hasQuoteRequest = conv.review_status === 'pending_review' || (conv.metadata as any)?.has_quote_request;
                    
                    return (
                      <div
                        key={conv.id}
                        className={cn(
                          "p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedConversation?.id === conv.id && "bg-muted",
                          hasQuoteRequest && conv.review_status === 'pending_review' && "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20"
                        )}
                        onClick={() => {
                          setSelectedConversation(conv);
                          loadConversation(conv.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <AgentBadge channel={conv.channel} recipientInbox={conv.recipient_inbox} />
                          <span className="font-medium flex-1 truncate text-sm">
                            {conv.subject || `${conv.channel} conversation`}
                          </span>
                          {(conv.unread_count ?? 0) > 0 && (
                            <Badge variant="destructive" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conv.last_message_at)}
                          </span>
                          {conv.priority && conv.priority !== "normal" && (
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(conv.priority)}`} />
                          )}
                          <QuoteStatusBadge reviewStatus={conv.review_status} />
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <ConversationContextHeader
                  agentId={activeInbox}
                  agentName={activeInbox}
                  channel={selectedConversation.channel}
                  recipientInbox={selectedConversation.recipient_inbox}
                  isExternal={isExternal}
                />

                <ThreadScopeBanner isExternal={isExternal} />

                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <ChannelIcon channel={selectedConversation.channel} className="w-5 h-5" />
                    <CardTitle className="text-lg flex-1">
                      {selectedConversation.subject || `${selectedConversation.channel} conversation`}
                    </CardTitle>
                    <ChannelBadge channel={selectedConversation.channel} size="md" />
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                  <ScrollArea className="flex-1 p-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.direction === "inbound" && (
                          <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                            <AvatarImage src={getMessageAvatar(msg) || undefined} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-[#405DE6] to-[#E1306C] text-white">
                              {getMessageInitials(msg)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] ${msg.direction === "outbound" ? "text-right" : ""}`}>
                          {msg.sender_name && msg.direction === "inbound" && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {msg.sender_name}
                            </div>
                          )}
                          <div
                            className={`inline-block p-3 rounded-lg ${
                              msg.direction === "outbound"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  
                  <ConversationActionsBar
                    conversationId={selectedConversation.id}
                    contactId={selectedConversation.contact_id}
                    channel={selectedConversation.channel}
                    customerName={selectedConversation.subject || undefined}
                  />

                  {canReply ? (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          disabled={sendingMessage}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newMessage.trim() && !sendingMessage) {
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          size="icon" 
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                        >
                          <Send className={`w-4 h-4 ${sendingMessage ? "animate-pulse" : ""}`} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DisabledReplyBox
                      reason="You cannot reply to external threads in this inbox."
                      handler={getExternalHandler(activeInbox)}
                    />
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: Contact Sidebar */}
        <div className="w-[280px] flex-shrink-0 hidden xl:block">
          <ContactSidebar
            contactId={selectedConversation?.contact_id || null}
            channel={selectedConversation?.channel}
          />
        </div>
      </div>
    </div>
  );
}
