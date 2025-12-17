import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Palette, 
  MessageCircle, 
  Cog, 
  ArrowRight,
  Sparkles,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentSelector } from "./AgentSelector";
import { AgentChatPanel } from "./AgentChatPanel";

interface TalkToAgentActionsProps {
  conversationId: string;
  contactId: string | null;
  channel: string;
  customerName?: string;
  subject?: string;
  className?: string;
}

const QUICK_AGENTS = [
  {
    id: "alex_morgan",
    name: "Alex Morgan",
    label: "Talk to Alex",
    description: "Quotes & Pricing",
    icon: Mail,
    color: "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
  },
  {
    id: "grant_miller",
    name: "Grant Miller",
    label: "Talk to Grant",
    description: "Design & Files",
    icon: Palette,
    color: "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30",
  },
  {
    id: "casey_ramirez",
    name: "Casey Ramirez",
    label: "Talk to Casey",
    description: "Social & DMs",
    icon: MessageCircle,
    color: "text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30",
  },
  {
    id: "ops_desk",
    name: "Ops Desk",
    label: "Flag Ops Desk",
    description: "Needs approval",
    icon: Cog,
    color: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
];

export function TalkToAgentActions({
  conversationId,
  contactId,
  channel,
  customerName,
  subject,
  className,
}: TalkToAgentActionsProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const context = {
    conversation_id: conversationId,
    contact_id: contactId,
    channel,
    customer_name: customerName || "Unknown",
    subject: subject || "Conversation",
  };

  const handleQuickAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowChat(true);
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowChat(true);
  };

  const handleCloseChat = (open: boolean) => {
    setShowChat(open);
    if (!open) {
      setSelectedAgentId(null);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Talk to Agent
        </span>
      </div>
      
      <div className="space-y-1.5">
        {QUICK_AGENTS.map((agent) => (
          <Button
            key={agent.id}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-xs h-auto py-2 px-3",
              agent.color
            )}
            onClick={() => handleQuickAgent(agent.id)}
          >
            <agent.icon className="w-4 h-4 mr-2 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="font-medium">{agent.label}</div>
              <div className="text-[10px] text-muted-foreground">{agent.description}</div>
            </div>
            <ArrowRight className="w-3 h-3 opacity-50" />
          </Button>
        ))}

        {/* More agents button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => setShowSelector(true)}
        >
          <Brain className="w-4 h-4 mr-2 flex-shrink-0" />
          <div className="flex-1 text-left">
            <div className="font-medium">More Agents...</div>
            <div className="text-[10px]">See all available agents</div>
          </div>
        </Button>
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center mt-3 italic">
        Click to start a conversation with the agent
      </p>

      <AgentSelector
        open={showSelector}
        onOpenChange={setShowSelector}
        onSelectAgent={handleSelectAgent}
      />

      <AgentChatPanel
        open={showChat}
        onOpenChange={handleCloseChat}
        agentId={selectedAgentId}
        context={context}
      />
    </div>
  );
}
