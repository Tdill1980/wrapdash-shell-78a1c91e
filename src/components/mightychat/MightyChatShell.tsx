import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentMightyChatLayout } from "./AgentMightyChatLayout";
import { OpsDeskScreen } from "./OpsDeskScreen";
import { ReviewQueue } from "./ReviewQueue";
import { MessageSquare, ClipboardList, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export type MightyMode = "chat" | "ops" | "review";

export function MightyChatShell() {
  const [mode, setMode] = useState<MightyMode>("review");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMode("chat");
  };

  return (
    <div className="h-full w-full flex flex-col">
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
          variant={mode === "ops" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("ops")}
          className={cn("gap-2", mode === "ops" && "bg-primary")}
        >
          <Brain className="w-4 h-4" />
          Ops Desk
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === "review" && (
          <ReviewQueue onSelectConversation={handleSelectConversation} />
        )}
        {mode === "chat" && (
          <AgentMightyChatLayout 
            onOpenOpsDesk={() => setMode("ops")} 
            initialConversationId={selectedConversationId}
          />
        )}
        {mode === "ops" && (
          <OpsDeskScreen onClose={() => setMode("chat")} />
        )}
      </div>
    </div>
  );
}
