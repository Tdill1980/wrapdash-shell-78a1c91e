import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, RefreshCw, Trash2, Clock, CheckCheck, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChannelBadge, ChannelIcon } from "@/components/mightychat/ChannelBadge";
import { WorkStreamsSidebar, type WorkStream, mapStreamToInbox } from "@/components/mightychat/WorkStreamsSidebar";
import { ConversationContextHeader } from "@/components/mightychat/ConversationContextHeader";
import { ThreadScopeBanner, DisabledReplyBox } from "@/components/mightychat/ThreadScopeLabel";
import { ConversationActionsBar } from "@/components/mightychat/ConversationActionsBar";
import { AgentBadge, QuoteStatusBadge } from "@/components/mightychat/InboxFilters";
import { AskAgentButton } from "@/components/mightychat/AskAgentButton";
import { AgentChatPanel } from "@/components/mightychat/AgentChatPanel";
import { useMightyPermissions, isExternalConversation, getExternalHandler } from "@/hooks/useMightyPermissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";
import type { AgentInbox } from "@/components/mightychat/AgentInboxTabs";

// Helper to strip HTML tags and extract readable text from email content
const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  // Check if content looks like HTML
  if (!html.includes("<") || !html.includes(">")) {
    return html;
  }

  // Create a temporary element to parse HTML
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove script and style elements
  const scripts = doc.querySelectorAll("script, style");
  scripts.forEach((el) => el.remove());

  // Get text content
  let text = doc.body?.textContent || doc.documentElement?.textContent || html;

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  // If we ended up with empty content, return a placeholder
  if (!text || text.length < 3) {
    return "[Email content - view original]";
  }

  return text;
};

const formatThreadText = (raw: string): string => {
  if (!raw) return "";

  // Some ingested messages concatenate fields; add line breaks for readability.
  // IMPORTANT: keep newlines (we render with whitespace-pre-wrap).
  const withSections = raw
    .replace(/\s*(From:)/gi, "\n$1")
    .replace(/\s*(Platform:)/gi, "\n$1")
    .replace(/\s*(Message:)/gi, "\n$1")
    .replace(/\s*(Files\s*\(\d+\):)/gi, "\n$1")
    // Put each URL on its own line so long tokens don't become unreadable
    .replace(/\s*(https?:\/\/)/g, "\n$1");

  return withSections
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
};

const renderLinkifiedText = (text: string) => {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, idx) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`u-${idx}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 break-all text-primary"
        >
          {part}
        </a>
      );
    }
    return <span key={`t-${idx}`}>{part}</span>;
  });
};

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
  // Joined data
  contact_name?: string | null;
  contact_email?: string | null;
  last_message_content?: string | null;
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
    status?: 'pending_approval' | 'sent' | 'approved';
    ai_mode?: string;
    instagram_sent?: boolean;
    sent_at?: string;
    generated_at?: string;
  } | null;
}

interface AgentMightyChatLayoutProps {
  onOpenOpsDesk: () => void;
  initialConversationId?: string | null;
  initialConversationChannel?: string | null;
  initialAgentChatId?: string | null;
  initialStream?: WorkStream | null;
}

// Empty state explanations for each stream
function EmptyStreamState({ stream }: { stream: WorkStream }) {
  const streamConfig: Record<WorkStream, { 
    title: string; 
    agent: string;
    inputs: string[]; 
    reason: string;
    action?: string;
  }> = {
    website: {
      title: "Website Leads",
      agent: "Jordan Lee",
      inputs: ["Website Chat Widget"],
      reason: "Chat widget may not be deployed on weprintwraps.com, or no visitors have started a chat yet.",
      action: "Check if embed code is placed before </body> tag on website"
    },
    quotes: {
      title: "Quotes Waiting",
      agent: "Alex Morgan",
      inputs: ["hello@weprintwraps.com", "Website (pricing intent)", "Instagram (pricing intent)"],
      reason: "No emails received at hello@ inbox, or no pricing inquiries detected from other channels.",
      action: "Verify Power Automate flow is active for hello@weprintwraps.com"
    },
    design: {
      title: "Design Reviews",
      agent: "Grant Miller",
      inputs: ["design@weprintwraps.com"],
      reason: "No emails received at design@ inbox.",
      action: "Verify Power Automate flow is active for design@weprintwraps.com"
    },
    dms: {
      title: "Affiliates",
      agent: "Casey Ramirez",
      inputs: ["MightyAffiliate", "Sponsored Artist Emails"],
      reason: "No affiliate communications in last 48h.",
      action: "Check MightyAffiliate portal for pending messages"
    },
    ops: {
      title: "Ops Desk",
      agent: "Manny Chen",
      inputs: ["jackson@weprintwraps.com", "Internal routing"],
      reason: "No emails received at jackson@ inbox or no items routed for approval.",
    }
  };

  const config = streamConfig[stream];

  return (
    <div className="p-4 space-y-3">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">No conversations</p>
        <p className="text-xs text-muted-foreground">{config.title} • {config.agent}</p>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            INPUTS FOR THIS STREAM
          </p>
          <ul className="text-xs text-foreground space-y-0.5">
            {config.inputs.map((input, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                {input}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">
            LIKELY REASON
          </p>
          <p className="text-xs text-muted-foreground">{config.reason}</p>
        </div>
        
        {config.action && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1">
              SUGGESTED ACTION
            </p>
            <p className="text-xs text-foreground">{config.action}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AgentMightyChatLayout({ onOpenOpsDesk, initialConversationId, initialConversationChannel, initialAgentChatId, initialStream }: AgentMightyChatLayoutProps) {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("id");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<WorkStream>(initialStream || 'quotes'); // Default to quotes (hello@ inbox) which typically has most traffic

  // Handle initialStream from URL params
  useEffect(() => {
    if (initialStream) {
      setActiveStream(initialStream);
    }
  }, [initialStream]);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showAgentChatPanel, setShowAgentChatPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const permissions = useMightyPermissions();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // Map stream to AgentInbox for permission checks
  const activeInbox: AgentInbox = mapStreamToInbox(activeStream) as AgentInbox;

  // Open agent chat panel if initialAgentChatId is provided
  useEffect(() => {
    if (initialAgentChatId) {
      setShowAgentChatPanel(true);
    }
  }, [initialAgentChatId]);

  // Set active stream based on initial channel from ReviewQueue
  useEffect(() => {
    if (initialConversationChannel) {
      const channel = initialConversationChannel.toLowerCase();
      if (channel === 'website' || channel === 'website_chat') {
        setActiveStream('website');
      } else if (channel === 'instagram' || channel === 'facebook' || channel === 'messenger') {
        setActiveStream('dms');
      } else if (channel === 'email') {
        // Default to quotes for email, the specific inbox will be shown
        setActiveStream('quotes');
      }
    }
  }, [initialConversationChannel]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadConversation(selectedId);
    }
  }, [selectedId, conversations]);

  // Handle initialConversationId from ReviewQueue
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId, conversations]);

  const loadConversations = async () => {
    // Email threads are access-controlled; if you're not signed in you'll see an empty result.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setConversations([]);
      setLoading(false);
      toast.error("Please sign in to view email inboxes");
      return;
    }

    const sinceIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Show threads active in the last 48h with contact info
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        contacts:contact_id (name, email)
      `)
      .or(`last_message_at.gte.${sinceIso},and(last_message_at.is.null,created_at.gte.${sinceIso})`)
      .order("last_message_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Map the joined data to flat structure
      const enrichedConversations = data.map((conv: any) => ({
        ...conv,
        contact_name: conv.contacts?.name || null,
        contact_email: conv.contacts?.email || null,
        contacts: undefined // Remove nested object
      }));
      
      // Fetch last message for each conversation (batch query)
      const convIds = enrichedConversations.map((c: any) => c.id);
      if (convIds.length > 0) {
        // Get latest message per conversation using a simple approach
        const { data: lastMessages } = await supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false });
        
        if (lastMessages) {
          // Group by conversation_id and take first (most recent)
          const lastMsgMap = new Map<string, string>();
          lastMessages.forEach((msg: any) => {
            if (!lastMsgMap.has(msg.conversation_id)) {
              lastMsgMap.set(msg.conversation_id, msg.content);
            }
          });
          
          enrichedConversations.forEach((conv: any) => {
            conv.last_message_content = lastMsgMap.get(conv.id) || null;
          });
        }
      }
      
      setConversations(enrichedConversations as Conversation[]);
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
    const channel = conv.channel?.toLowerCase() || '';
    
    // Website chat (both 'website' and 'website_chat')
    if (channel === 'website' || channel === 'website_chat') return 'website';
    
    // Social DMs (Instagram, Facebook)
    if (channel === 'instagram' || channel === 'facebook' || channel === 'messenger') return 'dms';
    
    // Email routing based on inbox
    if (channel === 'email') {
      const inbox = conv.recipient_inbox?.toLowerCase() || '';
      if (inbox.includes('design')) return 'design';
      if (inbox.includes('jackson')) return 'ops';
      // hello, general, or any other email goes to quotes
      return 'quotes';
    }
    
    // Default to quotes for any unknown channel
    return 'quotes';
  };

  // Filter conversations based on active stream
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const stream = getConversationStream(conv);
      return stream === activeStream;
    });
  }, [conversations, activeStream]);

  // Compute stream counts - use same logic as getConversationStream
  const streamCounts = useMemo(() => {
    const counts = { website: 0, quotes: 0, design: 0, dms: 0, ops: 0 };
    conversations.forEach(conv => {
      const stream = getConversationStream(conv);
      counts[stream]++;
    });
    return counts;
  }, [conversations]);

  // Clear selection if not in current stream
  useEffect(() => {
    if (selectedConversation && !filteredConversations.some(c => c.id === selectedConversation.id)) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [activeStream, filteredConversations, selectedConversation]);

  const isExternal = selectedConversation ? isExternalConversation(selectedConversation.channel) : false;
  const canReply = permissions.canReplyExternal(activeInbox) || !isExternal;

  // Compute signals for sidebar
  const streamSignals = useMemo(() => ({
    hotLeads: conversations.filter(c => c.channel === 'website' && c.priority === 'urgent').length,
    cxRiskCount: conversations.filter(c => c.priority === 'urgent' || c.priority === 'high').length,
    pendingReviews: conversations.filter(c => c.review_status === 'pending_review').length,
    quoteValue: 0 // Would come from actual quote data
  }), [conversations]);

  const formatTime = (dateStr: string | null) => formatTimeAZ(dateStr);

  const isVeryRecent = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < 60 * 60 * 1000; // less than 1 hour
  };

  const formatAbsoluteTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success("Message deleted");
    } catch (err) {
      console.error("Delete message error:", err);
      toast.error("Failed to delete message");
    }
  };

  // Mobile: show list when no conversation selected, show thread when selected
  const showMobileList = !selectedConversation;

  return (
    <div className="h-full min-h-0 flex flex-col p-2 md:p-4 overflow-hidden">
      {/* Header */}
      <div className="mb-2 md:mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold truncate">
            Mighty<span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>™
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">Work Streams • Focus Mode</p>
        </div>
        <div className="flex items-center gap-2">
          <AskAgentButton 
            variant="outline" 
            size="sm"
            className="hidden md:flex"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBackfillProfiles}
            disabled={backfillLoading}
            className="hidden md:flex"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${backfillLoading ? "animate-spin" : ""}`} />
            {backfillLoading ? "Updating..." : "Refresh IG Profiles"}
          </Button>
        </div>
      </div>

      {/* Mobile Stream Tabs */}
      <div className="flex lg:hidden gap-1 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(['website', 'quotes', 'design', 'dms'] as const).map((stream) => (
          <Button
            key={stream}
            variant={activeStream === stream ? "default" : "outline"}
            size="sm"
            className="text-xs whitespace-nowrap flex-shrink-0"
            onClick={() => setActiveStream(stream)}
          >
            {stream === 'website' && '🌐'}
            {stream === 'quotes' && '📧'}
            {stream === 'design' && '🎨'}
            {stream === 'dms' && '💬'}
            <span className="ml-1">{streamCounts[stream] || 0}</span>
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="text-xs whitespace-nowrap flex-shrink-0"
          onClick={onOpenOpsDesk}
        >
          ⚙️ Ops
        </Button>
      </div>

      {/* Main layout - responsive */}
      <div className="flex-1 min-h-0 flex gap-2 md:gap-4">
        {/* LEFT: Work Streams Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <WorkStreamsSidebar
            activeStream={activeStream}
            onStreamChange={setActiveStream}
            onOpenOpsDesk={onOpenOpsDesk}
            counts={streamCounts}
            signals={streamSignals}
          />
        </div>

        {/* CENTER: Conversations (list) OR Thread (DM) */}
        <div className="flex-1 min-h-0 flex gap-2 md:gap-4 overflow-hidden">
          {!selectedConversation ? (
            <Card className={cn(
              "flex flex-col transition-all overflow-hidden",
              // Width
              "w-full md:w-[360px] md:flex-shrink-0 lg:w-[320px]",
              // Show ~7 items, scroll for the rest
              "md:h-[520px]"
            )}>
              <CardHeader className="pb-2 px-3 md:px-6">
                <CardTitle className="text-base md:text-lg flex items-center justify-between">
                  <span>Conversations</span>
                  <Badge variant="outline" className="text-[10px] md:text-xs">
                    {filteredConversations.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {loading ? (
                    <div className="p-4 text-muted-foreground">Loading...</div>
                  ) : filteredConversations.length === 0 ? (
                    <EmptyStreamState stream={activeStream} />
                  ) : (
                    filteredConversations.map((conv) => {
                      const hasQuoteRequest = conv.review_status === 'pending_review';
                      const isUrgent = conv.priority === 'urgent';
                      const isHigh = conv.priority === 'high';
                      const hasUnread = (conv.unread_count ?? 0) > 0;

                      const getOwnerAndInbox = () => {
                        if (conv.channel === 'website') {
                          return { owner: 'Jordan Lee', inbox: 'Website Chat' };
                        }
                        if (conv.channel === 'instagram') {
                          return { owner: 'Social Team', inbox: 'Instagram DMs' };
                        }
                        if (conv.channel === 'email') {
                          const inbox = conv.recipient_inbox?.toLowerCase() || '';
                          if (inbox.includes('design')) return { owner: 'Grant Miller', inbox: 'design@weprintwraps.com' };
                          if (inbox.includes('jackson')) return { owner: 'Manny Chen', inbox: 'jackson@weprintwraps.com' };
                          return { owner: 'Alex Morgan', inbox: 'hello@weprintwraps.com' };
                        }
                        return { owner: 'Alex Morgan', inbox: conv.channel };
                      };

                      const ownerInfo = getOwnerAndInbox();

                      return (
                        <div
                          key={conv.id}
                          className={cn(
                            "p-2 border-b cursor-pointer transition-all duration-200 overflow-hidden",
                            "hover:bg-muted/50",
                            hasQuoteRequest && "border-l-2 border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
                            isUrgent && !hasQuoteRequest && "border-l-2 border-l-orange-500",
                            isHigh && !hasQuoteRequest && !isUrgent && "border-l-2 border-l-amber-400"
                          )}
                          onClick={() => {
                            setSelectedConversation(conv);
                            loadConversation(conv.id);
                          }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <AgentBadge channel={conv.channel} recipientInbox={conv.recipient_inbox} />
                            <span
                              className={cn(
                                "font-medium flex-1 truncate text-xs min-w-0",
                                hasUnread && "font-semibold"
                              )}
                            >
                              {conv.contact_name || conv.contact_email?.split('@')[0] || conv.subject || `${conv.channel}`}
                            </span>
                            {hasUnread && (
                              <Badge variant="destructive" className="text-[9px] h-4 min-w-[16px] px-1 flex-shrink-0">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>

                          {conv.last_message_content && (
                            <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                              {(() => {
                                const cleanContent = conv.channel === "email" ? stripHtmlTags(conv.last_message_content) : conv.last_message_content;
                                return cleanContent.slice(0, 50) + (cleanContent.length > 50 ? '...' : '');
                              })()}
                            </div>
                          )}

                          <div className="mt-0.5 text-[9px] text-muted-foreground flex items-center gap-1 min-w-0">
                            <span className="truncate">{ownerInfo.owner} • {ownerInfo.inbox}</span>
                          </div>

                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={cn(
                                "text-[9px] flex items-center gap-0.5",
                                isVeryRecent(conv.last_message_at)
                                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              {isVeryRecent(conv.last_message_at) && (
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              )}
                              {formatTime(conv.last_message_at)}
                            </span>
                            {isUrgent && (
                              <Badge variant="destructive" className="text-[8px] h-3 px-1">URGENT</Badge>
                            )}
                            {isHigh && !isUrgent && (
                              <Badge variant="outline" className="text-[8px] h-3 px-1 text-amber-600 border-amber-300">HIGH</Badge>
                            )}
                            {hasQuoteRequest && (
                              <Badge className="text-[8px] h-3 px-1 bg-red-500 text-white">REVIEW</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn("flex flex-col flex-1 min-h-0 overflow-hidden") }>
              <ConversationContextHeader
                agentId={activeInbox}
                agentName={activeInbox}
                channel={selectedConversation.channel}
                recipientInbox={selectedConversation.recipient_inbox}
                isExternal={isExternal}
              />

              <ThreadScopeBanner isExternal={isExternal} />

              <CardHeader className="border-b pb-2 md:pb-3 px-3 md:px-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2"
                    onClick={() => {
                      setSelectedConversation(null);
                      setMessages([]);
                    }}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <ChannelIcon channel={selectedConversation.channel} className="w-4 h-4 md:w-5 md:h-5" />
                  <CardTitle className="text-sm md:text-lg flex-1 truncate">
                    {selectedConversation.subject || `${selectedConversation.channel} conversation`}
                  </CardTitle>
                  <ChannelBadge channel={selectedConversation.channel} size="md" />
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="flex-1 min-h-0 p-2 md:p-4">
                  <div className="flex flex-col justify-end min-h-full">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-3 md:mb-4 flex group ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.direction === "inbound" && (
                          <Avatar className="w-7 h-7 md:w-8 md:h-8 mr-2 flex-shrink-0">
                            <AvatarImage src={getMessageAvatar(msg) || undefined} />
                            <AvatarFallback className="text-[10px] md:text-xs bg-gradient-to-br from-[#405DE6] to-[#E1306C] text-white">
                              {getMessageInitials(msg)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[85%] md:max-w-[70%] ${msg.direction === "outbound" ? "text-right" : ""}`}>
                          {msg.sender_name && msg.direction === "inbound" && (
                            <div className="text-[10px] md:text-xs text-muted-foreground mb-1">
                              {msg.sender_name}
                            </div>
                          )}
                          <div className="relative inline-block group">
                            <div
                              className={cn(
                                "p-2 md:p-3 rounded-lg",
                                msg.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}
                            >
                              <p className="text-xs md:text-sm whitespace-pre-wrap break-all">
                                {renderLinkifiedText(
                                  formatThreadText(
                                    msg.channel === "email" ? stripHtmlTags(msg.content) : msg.content
                                  )
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={cn(
                                "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20",
                                msg.direction === "outbound" ? "-left-6" : "-right-6"
                              )}
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                          <div className="text-[10px] md:text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                            {formatTime(msg.created_at)}
                            {msg.direction === "outbound" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center">
                                      {msg.metadata?.status === 'pending_approval' ? (
                                        <Clock className="w-3 h-3 text-amber-500" />
                                      ) : msg.metadata?.instagram_sent || msg.metadata?.status === 'sent' ? (
                                        <CheckCheck className="w-3 h-3 text-green-500" />
                                      ) : (
                                        <Check className="w-3 h-3 text-muted-foreground" />
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs">
                                    {msg.metadata?.status === 'pending_approval' ? (
                                      <span className="text-amber-500">⏳ Pending approval - not sent yet</span>
                                    ) : msg.metadata?.instagram_sent ? (
                                      <span className="text-green-500">✓ Sent to Instagram</span>
                                    ) : msg.metadata?.status === 'sent' ? (
                                      <span className="text-green-500">✓ Sent</span>
                                    ) : (
                                      <span>Saved</span>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <ConversationActionsBar
                conversationId={selectedConversation.id}
                contactId={selectedConversation.contact_id}
                channel={selectedConversation.channel}
                customerName={selectedConversation.subject || undefined}
              />

              {canReply ? (
                <div className="p-2 md:p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newMessage.trim() && !sendingMessage) {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button size="icon" onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
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
            </Card>
          )}
        </div>
      </div>

      {/* Agent Chat Panel - opened from Agent History */}
      <AgentChatPanel
        open={showAgentChatPanel}
        onOpenChange={setShowAgentChatPanel}
        agentId={null}
        initialChatId={initialAgentChatId}
      />
    </div>
  );
}
