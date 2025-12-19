import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentMightyChatLayout } from "./AgentMightyChatLayout";
import { OpsDeskScreen } from "./OpsDeskScreen";
import { ReviewQueue } from "./ReviewQueue";
import { AgentChatHistory } from "./AgentChatHistory";
import { AskAgentButton } from "./AskAgentButton";
import { AIStatusController } from "./AIStatusController";
import { MessageSquare, ClipboardList, Brain, History, Film, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export type MightyMode = "chat" | "ops" | "review" | "history";

export function MightyChatShell() {
  const [mode, setMode] = useState<MightyMode>("review");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedAgentChatId, setSelectedAgentChatId] = useState<string | null>(null);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMode("chat");
  };

  const handleResumeAgentChat = (chatId: string) => {
    setSelectedAgentChatId(chatId);
    setMode("chat");
  };

  return (
    <div className="h-full w-full flex flex-col">
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
      <div className="flex-1 overflow-hidden">
        {mode === "review" && (
          <ReviewQueue onSelectConversation={handleSelectConversation} />
        )}
        {mode === "chat" && (
          <AgentMightyChatLayout 
            onOpenOpsDesk={() => setMode("ops")} 
            initialConversationId={selectedConversationId}
            initialAgentChatId={selectedAgentChatId}
          />
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
