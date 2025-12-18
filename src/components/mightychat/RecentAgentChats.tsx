import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle2, MessageSquare, Loader2, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { RecentChat } from "@/hooks/useAgentChat";
import { AVAILABLE_AGENTS } from "./AgentSelector";

interface RecentAgentChatsProps {
  recentChats: RecentChat[];
  loading: boolean;
  agentId?: string;
  onResumeChat: (chatId: string) => void;
  onNewChat: () => void;
  onLoadChats: (agentId?: string) => void;
}

export function RecentAgentChats({
  recentChats,
  loading,
  agentId,
  onResumeChat,
  onNewChat,
  onLoadChats,
}: RecentAgentChatsProps) {
  useEffect(() => {
    onLoadChats(agentId);
  }, [agentId, onLoadChats]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delegated":
        return (
          <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
            Delegated
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
            Ready
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
            <Clock className="w-2.5 h-2.5 mr-0.5" />
            In Progress
          </Badge>
        );
    }
  };

  const agentConfig = agentId ? AVAILABLE_AGENTS.find((a) => a.id === agentId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          {agentConfig && (
            <div className={cn("p-1.5 rounded", agentConfig.color)}>
              <agentConfig.icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-sm">
              {agentConfig ? `${agentConfig.name}'s Chats` : "Recent Agent Chats"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {recentChats.length} conversation{recentChats.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={onNewChat} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </div>

      {recentChats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No previous chats found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start a new conversation with {agentConfig?.name || "an agent"}
          </p>
          <Button className="mt-4" onClick={onNewChat}>
            Start New Chat
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {recentChats.map((chat) => {
              const chatAgentConfig = AVAILABLE_AGENTS.find((a) => a.id === chat.agent_id);
              
              return (
                <button
                  key={chat.id}
                  onClick={() => onResumeChat(chat.id)}
                  className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {chatAgentConfig && (
                        <div className={cn("p-1 rounded shrink-0", chatAgentConfig.color)}>
                          <chatAgentConfig.icon className="w-3 h-3" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {chat.agent_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {chat.agent_role}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(chat.status)}
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {chat.last_message && (
                    <div className="mt-2 text-xs text-muted-foreground line-clamp-2 pl-7">
                      <span className="font-medium">
                        {chat.last_message_sender === "agent" ? chat.agent_name : "You"}:
                      </span>{" "}
                      {chat.last_message}
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-muted-foreground/70 pl-7">
                    {formatDistanceToNow(new Date(chat.last_message_at || chat.updated_at), { addSuffix: true })}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
