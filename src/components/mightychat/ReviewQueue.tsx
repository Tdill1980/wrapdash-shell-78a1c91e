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
  Brain
} from "lucide-react";
import { AgentSelector } from "./AgentSelector";
import { AgentChatPanel } from "./AgentChatPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ReviewQueueProps {
  onSelectConversation?: (conversationId: string) => void;
}

export function ReviewQueue({ onSelectConversation }: ReviewQueueProps) {
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<Record<string, unknown> | undefined>();

  // Fetch recent conversations from last 48 hours
  const { data: recentConversations, isLoading } = useQuery({
    queryKey: ["review-queue-conversations"],
    queryFn: async () => {
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          contacts (name, email, phone),
          messages (content, sender, created_at)
        `)
        .gte("created_at", fortyEightHoursAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

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
    setTaskContext({
      type: "conversation_review",
      conversationId: conversation.id,
      channel: conversation.channel,
      customerName: conversation.contacts?.name || "Unknown",
      customerEmail: conversation.contacts?.email,
      subject: conversation.subject,
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
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "email": return "bg-green-500/20 text-green-400";
      case "instagram": return "bg-pink-500/20 text-pink-400";
      case "website_chat": 
      case "website": return "bg-blue-500/20 text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with New Task button */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review Queue</h2>
          <p className="text-sm text-muted-foreground">Last 48 hours</p>
        </div>
        <Button onClick={handleNewTask} className="gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
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
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="chat">Website</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
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

          <TabsContent value="email" className="mt-0 space-y-2">
            {recentConversations?.filter(c => c.channel === "email").map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                onAskAgent={() => handleAskAboutConversation(conv)}
                onSelect={() => onSelectConversation?.(conv.id)}
                getChannelIcon={getChannelIcon}
                getChannelColor={getChannelColor}
              />
            ))}
          </TabsContent>

          <TabsContent value="social" className="mt-0 space-y-2">
            {recentConversations?.filter(c => c.channel === "instagram").map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                onAskAgent={() => handleAskAboutConversation(conv)}
                onSelect={() => onSelectConversation?.(conv.id)}
                getChannelIcon={getChannelIcon}
                getChannelColor={getChannelColor}
              />
            ))}
          </TabsContent>

          <TabsContent value="chat" className="mt-0 space-y-2">
            {recentConversations?.filter(c => c.channel === "website_chat" || c.channel === "website").map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                onAskAgent={() => handleAskAboutConversation(conv)}
                onSelect={() => onSelectConversation?.(conv.id)}
                getChannelIcon={getChannelIcon}
                getChannelColor={getChannelColor}
              />
            ))}
          </TabsContent>
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
  const lastMessage = conversation.messages?.[0];

  const getOwnerAndInbox = () => {
    const channel = conversation.channel;
    const recipientInbox = (conversation.recipient_inbox || "").toLowerCase();

    if (channel === "instagram") return { owner: "Casey Ramirez", inbox: "Instagram DMs" };
    // Some older code uses website_chat; newer pipeline uses website
    if (channel === "website" || channel === "website_chat") return { owner: "Jordan Lee", inbox: "Website Chat" };
    if (channel === "email") {
      if (recipientInbox.includes("design")) return { owner: "Grant Miller", inbox: "design@weprintwraps.com" };
      if (recipientInbox.includes("jackson")) return { owner: "Manny Chen", inbox: "jackson@weprintwraps.com" };
      return { owner: "Alex Morgan", inbox: "hello@weprintwraps.com" };
    }
    return { owner: "Alex Morgan", inbox: String(channel || "unknown") };
  };

  const ownerInfo = getOwnerAndInbox();

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={getChannelColor(conversation.channel)}>
                {getChannelIcon(conversation.channel)}
                <span className="ml-1 capitalize">{conversation.channel?.replace("_", " ")}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Owner / inbox */}
            <div className="text-[11px] text-muted-foreground mb-1">
              <span className="font-medium text-foreground/80">{ownerInfo.owner}</span>
              <span className="mx-1">•</span>
              <span className="truncate">{ownerInfo.inbox}</span>
            </div>

            <p className="font-medium truncate">
              {conversation.contacts?.name || conversation.contacts?.email || "Unknown"}
            </p>
            {conversation.subject && (
              <p className="text-sm text-muted-foreground truncate">{conversation.subject}</p>
            )}
            {lastMessage && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {lastMessage.content?.substring(0, 80)}...
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
