import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Mail, 
  MessageCircle, 
  Instagram, 
  CheckSquare,
  Clock,
  Brain,
  RefreshCw,
  FileText,
  AlertCircle
} from "lucide-react";
import { AgentSelector } from "./AgentSelector";
import { AgentChatPanel } from "./AgentChatPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRelativeAZ } from "@/lib/timezone";

interface ReviewQueueProps {
  onSelectConversation?: (conversationId: string) => void;
}

export function ReviewQueue({ onSelectConversation }: ReviewQueueProps) {
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<Record<string, unknown> | undefined>();

  // Fetch recent conversations from last 48 hours
  const { data: conversationsData, isLoading: loadingConversations, refetch: refetchConversations, dataUpdatedAt } = useQuery({
    queryKey: ["review-queue-conversations"],
    queryFn: async () => {
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
      const iso = fortyEightHoursAgo.toISOString();

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          contacts (name, email, phone),
          messages (content, direction, sender_name, created_at)
        `)
        .or(`last_message_at.gte.${iso},and(last_message_at.is.null,created_at.gte.${iso})`)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch unresolved ai_actions (from Ops Desk)
  const { data: aiActionsData, isLoading: loadingActions, refetch: refetchActions } = useQuery({
    queryKey: ["review-queue-ai-actions"],
    queryFn: async () => {
      const { data: actions, error } = await supabase
        .from("ai_actions")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with conversation data where available
      const enriched = await Promise.all(
        (actions || []).map(async (action) => {
          const payload = action.action_payload as Record<string, unknown> | null;
          const conversationId = payload?.conversation_id as string | undefined;
          
          let contact = null;
          let conversationData = null;
          
          if (conversationId) {
            const { data: conv } = await supabase
              .from("conversations")
              .select(`*, contacts (name, email, phone)`)
              .eq("id", conversationId)
              .single();
            conversationData = conv;
            contact = conv?.contacts;
          }

          return {
            ...action,
            _isAiAction: true,
            _enrichedConversation: conversationData,
            _contact: contact,
          };
        })
      );

      return enriched;
    },
    refetchInterval: 30000,
  });

  // Merge conversations and ai_actions into unified list
  const recentConversations: any[] = [
    ...(conversationsData || []).map(c => ({ ...c, _isAiAction: false })),
    ...(aiActionsData || []),
  ].sort((a: any, b: any) => {
    const dateA = new Date((a as any).last_message_at || a.created_at).getTime();
    const dateB = new Date((b as any).last_message_at || b.created_at).getTime();
    return dateB - dateA;
  });

  const isLoading = loadingConversations || loadingActions;
  const refetch = () => {
    refetchConversations();
    refetchActions();
  };

  // Helper to get channel from unified item (conversation or ai_action)
  const getItemChannel = (item: any): string => {
    if (item._isAiAction) {
      // For ai_actions, derive channel from payload.source first, then enriched conversation
      const payload = item.action_payload as any;
      return payload?.source || 
             item._enrichedConversation?.channel || 
             payload?.channel || 
             "task";
    }
    return item.channel || "unknown";
  };

  // Helper to get recipient inbox
  const getItemInbox = (item: any): string => {
    if (item._isAiAction) {
      return item._enrichedConversation?.recipient_inbox || "";
    }
    return item.recipient_inbox || "";
  };

  const handleNewTask = () => {
    setTaskContext(undefined);
    setShowAgentSelector(true);
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowAgentSelector(false);
    setShowAgentChat(true);
  };

  const handleAskAboutConversation = (conversation: any) => {
    const channel = getItemChannel(conversation);
    setTaskContext({
      type: "conversation_review",
      conversationId: conversation.id,
      channel: channel,
      customerName: conversation.contacts?.name || conversation._contact?.name || "Unknown",
      customerEmail: conversation.contacts?.email || conversation._contact?.email,
      subject: conversation.subject || (conversation.action_payload as any)?.subject,
      lastMessage: conversation.messages?.[0]?.content,
    });
    setShowAgentSelector(true);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="w-4 h-4" />;
      case "instagram": return <Instagram className="w-4 h-4" />;
      case "website_chat": 
      case "website": return <MessageCircle className="w-4 h-4" />;
      case "task": return <FileText className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "email": return "bg-green-500/20 text-green-400";
      case "instagram": return "bg-pink-500/20 text-pink-400";
      case "website_chat": 
      case "website": return "bg-blue-500/20 text-blue-400";
      case "task": return "bg-amber-500/20 text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Filter helpers using our channel helpers
  const filterByInbox = (inbox: string) => {
    return recentConversations?.filter(c => {
      const channel = getItemChannel(c);
      if (channel !== "email") return false;
      const recipientInbox = getItemInbox(c).toLowerCase();
      return recipientInbox.includes(inbox);
    }) || [];
  };

  const helloEmails = filterByInbox("hello");
  const designEmails = filterByInbox("design");
  const jacksonEmails = filterByInbox("jackson");
  const allEmails = recentConversations?.filter(c => getItemChannel(c) === "email") || [];
  const socialConvos = recentConversations?.filter(c => getItemChannel(c) === "instagram") || [];
  const websiteConvos = recentConversations?.filter(c => {
    const ch = getItemChannel(c);
    return ch === "website_chat" || ch === "website";
  }) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header with New Task button */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review Queue</h2>
          <p className="text-sm text-muted-foreground">
            Last 48 hours • Updated {dataUpdatedAt ? formatRelativeAZ(new Date(dataUpdatedAt).toISOString()) : "just now"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
          <Button onClick={handleNewTask} className="gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Quick Task Shortcuts */}
      <div className="p-4 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">Quick Start</p>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTaskContext({ type: "email_campaign", description: "Create email campaign" });
              setSelectedAgentId("jordan_lee");
              setShowAgentChat(true);
            }}
          >
            <Mail className="w-3 h-3 mr-1" />
            Email Campaign
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTaskContext({ type: "social_content", description: "Create social content" });
              setSelectedAgentId("casey_ramirez");
              setShowAgentChat(true);
            }}
          >
            <Instagram className="w-3 h-3 mr-1" />
            Social Content
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTaskContext({ type: "content_creation", description: "Create content in ContentBox" });
              setSelectedAgentId("emily_carter");
              setShowAgentChat(true);
            }}
          >
            <Brain className="w-3 h-3 mr-1" />
            ContentBox Task
          </Button>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({recentConversations?.length || 0})</TabsTrigger>
          <TabsTrigger value="hello" className="text-green-400">hello@ ({helloEmails.length})</TabsTrigger>
          <TabsTrigger value="design" className="text-purple-400">design@ ({designEmails.length})</TabsTrigger>
          <TabsTrigger value="jackson" className="text-orange-400">jackson@ ({jacksonEmails.length})</TabsTrigger>
          <TabsTrigger value="social" className="text-pink-400">Instagram ({socialConvos.length})</TabsTrigger>
          <TabsTrigger value="chat" className="text-blue-400">Website ({websiteConvos.length})</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 h-[calc(100vh-320px)]">
          <div className="p-4">
          <TabsContent value="all" className="mt-0 space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentConversations?.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No conversations in last 48 hours</p>
                <Button variant="outline" className="mt-4" onClick={handleNewTask}>
                  Start a new task
                </Button>
              </div>
            ) : (
              recentConversations?.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  onAskAgent={() => handleAskAboutConversation(conv)}
                  onSelect={() => onSelectConversation?.(conv.id)}
                  getChannelIcon={getChannelIcon}
                  getChannelColor={getChannelColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="hello" className="mt-0 space-y-2">
            {helloEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hello@ emails</div>
            ) : (
              helloEmails.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  onAskAgent={() => handleAskAboutConversation(conv)}
                  onSelect={() => onSelectConversation?.(conv.id)}
                  getChannelIcon={getChannelIcon}
                  getChannelColor={getChannelColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="design" className="mt-0 space-y-2">
            {designEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No design@ emails</div>
            ) : (
              designEmails.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  onAskAgent={() => handleAskAboutConversation(conv)}
                  onSelect={() => onSelectConversation?.(conv.id)}
                  getChannelIcon={getChannelIcon}
                  getChannelColor={getChannelColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="jackson" className="mt-0 space-y-2">
            {jacksonEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No jackson@ emails</div>
            ) : (
              jacksonEmails.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  onAskAgent={() => handleAskAboutConversation(conv)}
                  onSelect={() => onSelectConversation?.(conv.id)}
                  getChannelIcon={getChannelIcon}
                  getChannelColor={getChannelColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="social" className="mt-0 space-y-2">
            {socialConvos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No Instagram DMs</div>
            ) : (
              socialConvos.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  onAskAgent={() => handleAskAboutConversation(conv)}
                  onSelect={() => onSelectConversation?.(conv.id)}
                  getChannelIcon={getChannelIcon}
                  getChannelColor={getChannelColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-0 space-y-2">
            {websiteConvos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No website chats</div>
            ) : (
              websiteConvos.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  onAskAgent={() => handleAskAboutConversation(conv)}
                  onSelect={() => onSelectConversation?.(conv.id)}
                  getChannelIcon={getChannelIcon}
                  getChannelColor={getChannelColor}
                />
              ))
            )}
          </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      {/* Agent Selector Modal */}
      <AgentSelector
        open={showAgentSelector}
        onOpenChange={setShowAgentSelector}
        onSelectAgent={handleSelectAgent}
      />

      {/* Agent Chat Panel */}
      <AgentChatPanel
        open={showAgentChat}
        onOpenChange={setShowAgentChat}
        agentId={selectedAgentId}
        context={taskContext}
      />
    </div>
  );
}

function ConversationCard({ 
  conversation, 
  onAskAgent, 
  onSelect,
  getChannelIcon,
  getChannelColor
}: { 
  conversation: any;
  onAskAgent: () => void;
  onSelect: () => void;
  getChannelIcon: (channel: string) => React.ReactNode;
  getChannelColor: (channel: string) => string;
}) {
  const isAiAction = conversation._isAiAction;
  const payload = conversation.action_payload as Record<string, unknown> | null;
  
  // For ai_actions, use enriched conversation data
  const enrichedConvo = conversation._enrichedConversation;
  const contact = conversation.contacts || conversation._contact;
  const lastMessage = conversation.messages?.[0];

  // Derive channel from payload source field, enriched conversation, or conversation
  const payloadSource = (payload?.source as string) || "";
  const channel = payloadSource || enrichedConvo?.channel || conversation.channel || "task";

  const getOwnerAndInbox = () => {
    const recipientInbox = (enrichedConvo?.recipient_inbox || conversation.recipient_inbox || "").toLowerCase();

    if (channel === "instagram") return { owner: "Social Team", inbox: "Instagram DMs" };
    if (channel === "website" || channel === "website_chat") return { owner: "Jordan Lee", inbox: "Website Chat" };
    if (channel === "email") {
      if (recipientInbox.includes("design")) return { owner: "Grant Miller", inbox: "design@weprintwraps.com" };
      if (recipientInbox.includes("jackson")) return { owner: "Manny Chen", inbox: "jackson@weprintwraps.com" };
      return { owner: "Alex Morgan", inbox: "hello@weprintwraps.com" };
    }
    if (isAiAction) {
      // Format action type nicely for display
      const actionLabel = conversation.action_type?.replace(/_/g, " ") || "pending task";
      return { owner: "AI Task", inbox: actionLabel };
    }
    return { owner: "Alex Morgan", inbox: String(channel || "unknown") };
  };

  const ownerInfo = getOwnerAndInbox();

  // Get customer name from various sources - including sender_username for Instagram
  const customerName = contact?.name || 
    contact?.email || 
    (payload?.customer_name as string) || 
    (payload?.customer_email as string) ||
    (payload?.sender_username as string) ||
    "Unknown";

  // Get subject/title from various sources
  const subject = conversation.subject || 
    (payload?.subject as string) || 
    (payload?.quote_number as string) ||
    (isAiAction ? `${conversation.action_type?.replace(/_/g, " ")} task` : null);

  // Get preview text
  const previewText = lastMessage?.content || 
    (payload?.message as string) ||
    (payload?.preview as string) || 
    (payload?.content as string) ||
    (isAiAction && payload?.file_urls ? "Contains file attachment(s)" : null);

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={getChannelColor(channel)}>
                {getChannelIcon(channel)}
                <span className="ml-1 capitalize">{channel?.replace("_", " ")}</span>
              </Badge>
              {isAiAction && (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 text-[10px]">
                  {conversation.action_type?.replace("_", " ")}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatRelativeAZ(conversation.created_at)}
              </span>
            </div>

            {/* Owner / inbox */}
            <div className="text-[11px] text-muted-foreground mb-1">
              <span className="font-medium text-foreground/80">{ownerInfo.owner}</span>
              <span className="mx-1">•</span>
              <span className="truncate">{ownerInfo.inbox}</span>
            </div>

            <p className="font-medium truncate">{customerName}</p>
            {subject && (
              <p className="text-sm text-muted-foreground truncate">{subject}</p>
            )}
            {previewText && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {previewText.substring(0, 80)}...
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="outline" onClick={onSelect}>
              View
            </Button>
            <Button size="sm" variant="secondary" onClick={onAskAgent}>
              <Brain className="w-3 h-3 mr-1" />
              Ask Agent
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
