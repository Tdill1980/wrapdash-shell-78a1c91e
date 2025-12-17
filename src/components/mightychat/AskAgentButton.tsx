import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { AgentSelector } from "./AgentSelector";
import { AgentChatPanel } from "./AgentChatPanel";
import { cn } from "@/lib/utils";

interface AskAgentButtonProps {
  /** Optional pre-selected agent ID */
  agentId?: string;
  /** Context to pass to the agent chat (e.g., conversation details) */
  context?: Record<string, unknown>;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "link";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional class names */
  className?: string;
  /** Custom button text */
  children?: React.ReactNode;
}

export function AskAgentButton({
  agentId: preSelectedAgentId,
  context,
  variant = "outline",
  size = "sm",
  className,
  children,
}: AskAgentButtonProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(preSelectedAgentId || null);

  const handleClick = () => {
    if (preSelectedAgentId) {
      // If agent is pre-selected, go directly to chat
      setSelectedAgentId(preSelectedAgentId);
      setShowChat(true);
    } else {
      // Otherwise show selector
      setShowSelector(true);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowChat(true);
  };

  const handleCloseChat = (open: boolean) => {
    setShowChat(open);
    if (!open) {
      setSelectedAgentId(preSelectedAgentId || null);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={handleClick}
      >
        <Brain className="w-4 h-4" />
        {children || "Talk to Agent"}
      </Button>

      {!preSelectedAgentId && (
        <AgentSelector
          open={showSelector}
          onOpenChange={setShowSelector}
          onSelectAgent={handleSelectAgent}
        />
      )}

      <AgentChatPanel
        open={showChat}
        onOpenChange={handleCloseChat}
        agentId={selectedAgentId}
        context={context}
      />
    </>
  );
}
