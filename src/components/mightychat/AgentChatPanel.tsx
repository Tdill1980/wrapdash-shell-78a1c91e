import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send, X, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentChat, type AgentChatMessage } from "@/hooks/useAgentChat";
import { DelegateTaskModal } from "./DelegateTaskModal";
import { AVAILABLE_AGENTS } from "./AgentSelector";

interface AgentChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string | null;
  context?: Record<string, unknown>;
}

export function AgentChatPanel({ open, onOpenChange, agentId, context }: AgentChatPanelProps) {
  const [input, setInput] = useState("");
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    chatId,
    agent,
    messages,
    loading,
    sending,
    confirmed,
    suggestedTask,
    startChat,
    sendMessage,
    delegateTask,
    closeChat,
  } = useAgentChat();

  // Start chat when panel opens with an agent
  useEffect(() => {
    if (open && agentId && !chatId) {
      startChat(agentId, context);
    }
  }, [open, agentId, chatId, startChat, context]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = () => {
    closeChat();
    onOpenChange(false);
  };

  const handleSend = () => {
    if (input.trim() && !sending) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelegate = async (description: string) => {
    const result = await delegateTask(description);
    if (result.success) {
      setShowDelegateModal(false);
      handleClose();
    }
  };

  const agentConfig = AVAILABLE_AGENTS.find((a) => a.id === agentId);

  const getStatusBadge = () => {
    if (confirmed) {
      return (
        <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ready to Delegate
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-400 border-amber-500/30">
        <Clock className="w-3 h-3 mr-1" />
        Clarifying
      </Badge>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <span>🧠</span>
                Agent Chat
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {agent && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {agentConfig && (
                    <div className={cn("p-1.5 rounded", agentConfig.color)}>
                      <agentConfig.icon className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.role}</div>
                  </div>
                </div>
                {getStatusBadge()}
              </div>
            )}
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>Start a conversation with {agent?.name || "the agent"}.</p>
                <p className="mt-1 text-xs">Ask questions, clarify intent, then delegate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} agentName={agent?.name} />
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border/50 space-y-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask, clarify, correct..."
                disabled={sending || loading}
                className="flex-1"
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || sending || loading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!confirmed}
                onClick={() => setShowDelegateModal(true)}
              >
                {confirmed ? "Delegate Task" : "Waiting for Confirmation..."}
              </Button>
            </div>

            {!confirmed && (
              <p className="text-xs text-muted-foreground text-center">
                Agent must confirm understanding before delegation
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DelegateTaskModal
        open={showDelegateModal}
        onOpenChange={setShowDelegateModal}
        agentName={agent?.name || "Agent"}
        suggestedTask={suggestedTask}
        onDelegate={handleDelegate}
      />
    </>
  );
}

function MessageBubble({ message, agentName }: { message: AgentChatMessage; agentName?: string }) {
  const isUser = message.sender === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%] text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {!isUser && (
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {agentName || "Agent"}
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.metadata?.confirmed && (
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">
            <CheckCircle2 className="w-3 h-3" />
            Ready to delegate
          </div>
        )}
      </div>
    </div>
  );
}
