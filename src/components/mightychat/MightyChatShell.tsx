import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AgentMightyChatLayout } from "./AgentMightyChatLayout";
import { OpsDeskScreen } from "./OpsDeskScreen";
import { ReviewQueue } from "./ReviewQueue";
import { AgentChatHistory } from "./AgentChatHistory";
import { AgentsManagement } from "./AgentsManagement";
import { AskAgentButton } from "./AskAgentButton";
import { AIStatusController } from "./AIStatusController";
import { MessageSquare, ClipboardList, Brain, History, Bot, Film, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkStream } from "./WorkStreamsSidebar";

export type MightyMode = "chat" | "ops" | "review" | "history" | "agents";

export function MightyChatShell() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<MightyMode>("review");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversationChannel, setSelectedConversationChannel] = useState<string | null>(null);
  const [selectedAgentChatId, setSelectedAgentChatId] = useState<string | null>(null);
  const [initialStream, setInitialStream] = useState<WorkStream | null>(null);

  // Handle URL params for deep-linking from AI Approval modal
  useEffect(() => {
    const id = searchParams.get("id");
    let stream = searchParams.get("stream") as WorkStream | null;
    
    // Map legacy "quotes" to "hello" for backward compatibility
    if (stream === ("quotes" as string) || stream === ("website" as string)) {
      stream = "hello";
    }

    if (id) {
      setSelectedConversationId(id);
      setMode("chat");

      if (stream && ["hello", "design", "jackson", "dms", "ops", "website", "phone"].includes(stream)) {
        setInitialStream(stream);
      }
    }
  }, [searchParams]);

  const handleSelectConversation = (conversationId: string, channel?: string) => {
    setSelectedConversationId(conversationId);
    setSelectedConversationChannel(channel || null);
    setSelectedAgentChatId(null); // Clear any previous agent chat
    setMode("chat");
  };


  const handleResumeAgentChat = (chatId: string) => {
    setSelectedAgentChatId(chatId);
    setMode("chat");
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
      {/* AI Status Controller */}
      <AIStatusController />
      
      {/* Mode Tabs */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-background/95 backdrop-blur">
        <Button
          variant={mode === "review" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("review")}
          className={cn("gap-2", mode === "review" && "bg-primary")}
        >
          <ClipboardList className="w-4 h-4" />
          Review Queue
        </Button>
        <Button
          variant={mode === "chat" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("chat")}
          className={cn("gap-2", mode === "chat" && "bg-primary")}
        >
          <MessageSquare className="w-4 h-4" />
          Inbox
        </Button>
        <Button
          variant={mode === "agents" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("agents")}
          className={cn("gap-2", mode === "agents" && "bg-primary")}
        >
          <Bot className="w-4 h-4" />
          Agents
        </Button>
        <Button
          variant={mode === "history" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("history")}
          className={cn("gap-2", mode === "history" && "bg-primary")}
        >
          <History className="w-4 h-4" />
          Agent History
        </Button>
        <Button
          variant={mode === "ops" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("ops")}
          className={cn("gap-2", mode === "ops" && "bg-primary")}
        >
          <Brain className="w-4 h-4" />
          Ops Desk
        </Button>
      </div>

      {/* Agent Quick-Access Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30 overflow-x-auto">
        <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">New Chat:</span>
        <AskAgentButton agentId="noah_bennett" variant="outline" size="sm" className="shrink-0">
          <Film className="h-4 w-4 text-amber-500" /> Noah
        </AskAgentButton>
        <AskAgentButton agentId="emily_carter" variant="outline" size="sm" className="shrink-0">
          <Sparkles className="h-4 w-4 text-purple-500" /> Emily
        </AskAgentButton>
        <AskAgentButton agentId="casey_ramirez" variant="outline" size="sm" className="shrink-0">
          <Heart className="h-4 w-4 text-pink-500" /> Casey
        </AskAgentButton>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {mode === "review" && (
          <ReviewQueue onSelectConversation={handleSelectConversation} />
        )}
        {mode === "chat" && (
          <AgentMightyChatLayout 
            onOpenOpsDesk={() => setMode("ops")} 
            initialConversationId={selectedConversationId}
            initialConversationChannel={selectedConversationChannel}
            initialAgentChatId={selectedAgentChatId}
            initialStream={initialStream}
          />
        )}
        {mode === "agents" && (
          <AgentsManagement />
        )}
        {mode === "history" && (
          <AgentChatHistory onResumeChat={handleResumeAgentChat} />
        )}
        {mode === "ops" && (
          <OpsDeskScreen onClose={() => setMode("chat")} />
        )}
      </div>
    </div>
  );
}
