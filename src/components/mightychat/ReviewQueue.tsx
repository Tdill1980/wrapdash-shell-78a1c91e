import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Mail, 
  MessageCircle, 
  Instagram, 
  Clock,
  Brain,
  RefreshCw,
  FileText,
  Unplug,
  DollarSign,
  Image as ImageIcon,
  Facebook
} from "lucide-react";
import { AgentSelector } from "./AgentSelector";
import { AgentChatPanel } from "./AgentChatPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ReviewQueueProps {
  onSelectConversation?: (conversationId: string) => void;
}

export function ReviewQueue({ onSelectConversation }: ReviewQueueProps) {
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<Record<string, unknown> | undefined>();
  const [activeTab, setActiveTab] = useState("all");
  const [emailSubTab, setEmailSubTab] = useState<string | null>(null);

  // Fetch recent conversations from last 48 hours
  const { data: conversationsData, isLoading: loadingConversations, refetch: refetchConversations } = useQuery({
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

  // Fetch unresolved ai_actions
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

  // Helper to get source/channel from unified item
  const getItemSource = (item: any): string => {
    if (item._isAiAction) {
      const payload = item.action_payload as any;
      return payload?.source || 
             item._enrichedConversation?.channel || 
             payload?.channel || 
             "unknown";
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
    const source = getItemSource(conversation);
    setTaskContext({
      type: "conversation_review",
      conversationId: conversation.id,
      channel: source,
      customerName: conversation.contacts?.name || conversation._contact?.name || "Unknown",
      customerEmail: conversation.contacts?.email || conversation._contact?.email,
      subject: conversation.subject || (conversation.action_payload as any)?.subject,
      lastMessage: conversation.messages?.[0]?.content,
    });
    setShowAgentSelector(true);
  };

  // Filter helpers
  const filterBySource = (source: string) => {
    return recentConversations?.filter(c => {
      const itemSource = getItemSource(c);
      if (source === "instagram") return itemSource === "instagram";
      if (source === "email") return itemSource === "email";
      if (source === "website") return itemSource === "website_chat" || itemSource === "website";
      return false;
    }) || [];
  };

  const filterByInbox = (inbox: string) => {
    return recentConversations?.filter(c => {
      const source = getItemSource(c);
      if (source !== "email") return false;
      const recipientInbox = getItemInbox(c).toLowerCase();
      return recipientInbox.includes(inbox);
    }) || [];
  };

  const instagramItems = filterBySource("instagram");
  const emailItems = filterBySource("email");
  const websiteItems = filterBySource("website");
  const helloEmails = filterByInbox("hello");
  const designEmails = filterByInbox("design");
  const jacksonEmails = filterByInbox("jackson");

  // Get current filtered items based on active tab and sub-tab
  const getCurrentItems = () => {
    if (activeTab === "all") return recentConversations;
    if (activeTab === "instagram") return instagramItems;
    if (activeTab === "facebook") return []; // Placeholder
    if (activeTab === "email") {
      if (emailSubTab === "hello") return helloEmails;
      if (emailSubTab === "design") return designEmails;
      if (emailSubTab === "jackson") return jacksonEmails;
      return emailItems;
    }
    if (activeTab === "website") return websiteItems;
    return recentConversations;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review Queue</h2>
          <p className="text-sm text-muted-foreground">Last 48 hours</p>
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

      {/* Main Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 p-2 overflow-x-auto">
          <TabButton 
            active={activeTab === "all"} 
            onClick={() => { setActiveTab("all"); setEmailSubTab(null); }}
            count={recentConversations.length}
          >
            All
          </TabButton>
          <TabButton 
            active={activeTab === "instagram"} 
            onClick={() => { setActiveTab("instagram"); setEmailSubTab(null); }}
            count={instagramItems.length}
            icon={<Instagram className="w-3.5 h-3.5" />}
            color="pink"
          >
            Instagram
          </TabButton>
          <TabButton 
            active={activeTab === "facebook"} 
            onClick={() => { setActiveTab("facebook"); setEmailSubTab(null); }}
            count={0}
            icon={<Facebook className="w-3.5 h-3.5" />}
            color="blue"
          >
            Facebook
          </TabButton>
          <TabButton 
            active={activeTab === "email"} 
            onClick={() => { setActiveTab("email"); setEmailSubTab(null); }}
            count={emailItems.length}
            icon={<Mail className="w-3.5 h-3.5" />}
            color="green"
          >
            Email
          </TabButton>
          <TabButton 
            active={activeTab === "website"} 
            onClick={() => { setActiveTab("website"); setEmailSubTab(null); }}
            count={websiteItems.length}
            icon={<MessageCircle className="w-3.5 h-3.5" />}
            color="cyan"
          >
            Website Chat
          </TabButton>
        </div>

        {/* Email Sub-tabs */}
        {activeTab === "email" && (
          <div className="flex gap-1 px-2 pb-2">
            <EmailSubTab 
              active={emailSubTab === null} 
              onClick={() => setEmailSubTab(null)}
              count={emailItems.length}
              color="gray"
            >
              All Email
            </EmailSubTab>
            <EmailSubTab 
              active={emailSubTab === "hello"} 
              onClick={() => setEmailSubTab("hello")}
              count={helloEmails.length}
              color="green"
            >
              hello@
            </EmailSubTab>
            <EmailSubTab 
              active={emailSubTab === "design"} 
              onClick={() => setEmailSubTab("design")}
              count={designEmails.length}
              color="purple"
            >
              design@
            </EmailSubTab>
            <EmailSubTab 
              active={emailSubTab === "jackson"} 
              onClick={() => setEmailSubTab("jackson")}
              count={jacksonEmails.length}
              color="orange"
            >
              jackson@
            </EmailSubTab>
          </div>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {activeTab === "facebook" ? (
            <FacebookPlaceholder />
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : getCurrentItems().length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No items in this queue</p>
            </div>
          ) : (
            getCurrentItems().map((item) => (
              <TaskCard
                key={item.id}
                item={item}
                onAction={() => handleAskAboutConversation(item)}
                onSelect={() => onSelectConversation?.(item.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

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

// Tab Button Component
function TabButton({ 
  children, 
  active, 
  onClick, 
  count, 
  icon,
  color = "default"
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void; 
  count: number;
  icon?: React.ReactNode;
  color?: "default" | "pink" | "blue" | "green" | "cyan";
}) {
  const colorClasses = {
    default: active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80",
    pink: active ? "bg-pink-500 text-white" : "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30",
    blue: active ? "bg-blue-500 text-white" : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
    green: active ? "bg-green-500 text-white" : "bg-green-500/20 text-green-400 hover:bg-green-500/30",
    cyan: active ? "bg-cyan-500 text-white" : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${colorClasses[color]}`}
    >
      {icon}
      {children}
      <span className={`ml-1 text-xs ${active ? "opacity-90" : "opacity-70"}`}>({count})</span>
    </button>
  );
}

// Email Sub-tab Component
function EmailSubTab({ 
  children, 
  active, 
  onClick, 
  count,
  color
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void; 
  count: number;
  color: "gray" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    gray: active ? "border-foreground text-foreground" : "border-muted-foreground/30 text-muted-foreground",
    green: active ? "border-green-500 text-green-400 bg-green-500/10" : "border-green-500/30 text-green-400/70",
    purple: active ? "border-purple-500 text-purple-400 bg-purple-500/10" : "border-purple-500/30 text-purple-400/70",
    orange: active ? "border-orange-500 text-orange-400 bg-orange-500/10" : "border-orange-500/30 text-orange-400/70",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${colorClasses[color]}`}
    >
      {children}
      <span className="opacity-70">({count})</span>
    </button>
  );
}

// Facebook Placeholder Component
function FacebookPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
        <Unplug className="w-8 h-8 text-blue-400" />
      </div>
      <p className="text-blue-400 font-medium">Waiting for integration</p>
      <p className="text-sm text-muted-foreground mt-1">Facebook Messenger will appear here once connected</p>
    </div>
  );
}

// Task Card Component - Matches the reference design
function TaskCard({ 
  item, 
  onAction,
  onSelect
}: { 
  item: any;
  onAction: () => void;
  onSelect: () => void;
}) {
  const isAiAction = item._isAiAction;
  const payload = item.action_payload as Record<string, unknown> | null;
  
  // Get source/channel
  const getSource = () => {
    if (isAiAction) {
      return (payload?.source as string) || 
             item._enrichedConversation?.channel || 
             "unknown";
    }
    return item.channel || "unknown";
  };
  const source = getSource();

  // Get username/identifier
  const username = (payload?.sender_username as string) || 
                   (payload?.customer_name as string) || 
                   item.contacts?.name || 
                   item._contact?.name ||
                   item.contacts?.email ||
                   "Unknown";

  // Get action type for AI actions
  const actionType = isAiAction ? item.action_type : null;
  const formattedActionType = actionType?.replace(/_/g, " ").toUpperCase() || "";

  // Get file URLs for file_review actions
  const fileUrls = (payload?.file_urls as string[]) || [];

  // Get message/preview
  const message = (payload?.message as string) || 
                  item.messages?.[0]?.content ||
                  (payload?.preview as string) ||
                  "";

  // Format timestamp
  const timestamp = format(new Date(item.created_at), "h:mm a");

  // Source icon and color
  const getSourceIcon = () => {
    switch (source) {
      case "instagram": return <Instagram className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "website_chat":
      case "website": return <MessageCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceColor = () => {
    switch (source) {
      case "instagram": return "text-pink-400 bg-pink-500/20";
      case "email": return "text-green-400 bg-green-500/20";
      case "website_chat":
      case "website": return "text-cyan-400 bg-cyan-500/20";
      default: return "text-muted-foreground bg-muted";
    }
  };

  // Action type badge color
  const getActionBadgeColor = () => {
    if (!actionType) return "";
    switch (actionType) {
      case "file_review": return "bg-amber-500/20 text-amber-400";
      case "create_quote": return "bg-emerald-500/20 text-emerald-400";
      default: return "bg-blue-500/20 text-blue-400";
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case "file_review": return <ImageIcon className="w-3 h-3" />;
      case "create_quote": return <DollarSign className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={onSelect}>
      <CardContent className="p-3">
        {/* Row 1: Source icon + Action type badge + Action button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${getSourceColor()}`}>
              {getSourceIcon()}
            </div>
            {isAiAction && actionType && (
              <Badge variant="secondary" className={`text-[10px] uppercase font-semibold ${getActionBadgeColor()}`}>
                {getActionIcon()}
                <span className="ml-1">{formattedActionType}</span>
              </Badge>
            )}
            {!isAiAction && (
              <Badge variant="secondary" className={`text-[10px] uppercase ${getSourceColor()}`}>
                {source.replace("_", " ")}
              </Badge>
            )}
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0 rounded-full"
            onClick={(e) => { e.stopPropagation(); onAction(); }}
          >
            <Brain className="w-4 h-4" />
          </Button>
        </div>

        {/* Row 2: Username */}
        <p className="text-sm font-medium text-foreground mb-1">{username}</p>

        {/* Row 3: File count or message preview */}
        {fileUrls.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              📎 {fileUrls.length} file(s) attached
            </p>
            {/* Row 4: Thumbnails */}
            <div className="flex gap-1 mb-2">
              {fileUrls.slice(0, 4).map((url, idx) => (
                <div 
                  key={idx} 
                  className="w-12 h-12 rounded bg-muted overflow-hidden"
                >
                  <img 
                    src={url} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
              {fileUrls.length > 4 && (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{fileUrls.length - 4}
                </div>
              )}
            </div>
          </>
        ) : message ? (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{message}</p>
        ) : null}

        {/* Row 5: Timestamp */}
        <p className="text-[10px] text-muted-foreground">{timestamp}</p>
      </CardContent>
    </Card>
  );
}
