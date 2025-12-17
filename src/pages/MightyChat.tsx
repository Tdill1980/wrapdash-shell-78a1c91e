import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
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
import { InboxFilters, AgentBadge, QuoteStatusBadge, type InboxFilter } from "@/components/mightychat/InboxFilters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function MightyChat() {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("id");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');

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
      // Cast metadata to proper type
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

      // Mark as read
      await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", id);
    }
  };

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

  const [backfillLoading, setBackfillLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

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
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      // Get the contact to find Instagram sender ID
      const { data: contact } = await supabase
        .from("contacts")
        .select("metadata")
        .eq("id", selectedConversation.contact_id)
        .single();

      const instagramSenderId = (contact?.metadata as any)?.instagram_sender_id;

      if (selectedConversation.channel === "instagram" && instagramSenderId) {
        // Send via Instagram DM
        const { error } = await supabase.functions.invoke("send-instagram-reply", {
          body: {
            recipient: instagramSenderId,
            message: messageText
          }
        });

        if (error) throw error;
      }

      // Save message to database
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

      // Update conversation
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);

      // Add to local messages
      if (savedMsg) {
        setMessages(prev => [...prev, savedMsg as Message]);
      }

      if (selectedConversation.channel === "instagram") {
        toast.success("Reply sent via Instagram DM");
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  // Filter conversations based on active filter
  const filteredConversations = useMemo(() => {
    if (activeFilter === 'all') return conversations;
    
    return conversations.filter(conv => {
      switch (activeFilter) {
        case 'instagram':
          return conv.channel === 'instagram';
        case 'website':
          return conv.channel === 'website';
        case 'hello':
          return conv.channel === 'email' && (!conv.recipient_inbox || conv.recipient_inbox?.includes('hello'));
        case 'design':
          return conv.channel === 'email' && conv.recipient_inbox?.includes('design');
        case 'jackson':
          return conv.channel === 'email' && conv.recipient_inbox?.includes('jackson');
        case 'quotes':
          return conv.review_status === 'pending_review' || (conv.metadata as any)?.has_quote_request;
        default:
          return true;
      }
    });
  }, [conversations, activeFilter]);

  // Compute filter counts
  const filterCounts = useMemo(() => ({
    all: conversations.length,
    hello: conversations.filter(c => c.channel === 'email' && (!c.recipient_inbox || c.recipient_inbox?.includes('hello'))).length,
    design: conversations.filter(c => c.channel === 'email' && c.recipient_inbox?.includes('design')).length,
    jackson: conversations.filter(c => c.channel === 'email' && c.recipient_inbox?.includes('jackson')).length,
    instagram: conversations.filter(c => c.channel === 'instagram').length,
    website: conversations.filter(c => c.channel === 'website').length,
    pendingQuotes: conversations.filter(c => c.review_status === 'pending_review' || (c.metadata as any)?.has_quote_request).length
  }), [conversations]);


  // If the selected conversation isn't in the current filter, clear it (prevents showing IG while in Jackson inbox)
  useEffect(() => {
    if (selectedConversation && !filteredConversations.some(c => c.id === selectedConversation.id)) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [activeFilter, filteredConversations, selectedConversation]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Mighty<span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>™
            </h1>
            <p className="text-muted-foreground">Unified Inbox: DM, Email, SMS</p>
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

        {/* Inbox Filters */}
        <div className="mb-4">
          <InboxFilters 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter}
            counts={filterCounts}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-260px)]">
          {/* Conversation List - 3 cols */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Conversations</span>
                <Badge variant="outline" className="text-xs">
                  {filteredConversations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-360px)]">
                {loading ? (
                  <div className="p-4 text-muted-foreground">Loading...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-muted-foreground">
                    {activeFilter === 'all' ? 'No conversations yet' : `No ${activeFilter} conversations`}
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

          {/* Message Thread - 6 cols */}
          <Card className="lg:col-span-6">
            {selectedConversation ? (
              <>
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
                <CardContent className="p-0 flex flex-col h-[calc(100vh-350px)]">
                  <ScrollArea className="flex-1 p-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 flex ${
                          msg.direction === "outbound" ? "justify-end" : "justify-start"
                        }`}
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
                  
                  {/* Reply Input */}
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
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </Card>

          {/* Contact Sidebar - 3 cols */}
          <div className="lg:col-span-3 hidden lg:block">
            <ContactSidebar 
              contactId={selectedConversation?.contact_id || null}
              channel={selectedConversation?.channel || ""}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
