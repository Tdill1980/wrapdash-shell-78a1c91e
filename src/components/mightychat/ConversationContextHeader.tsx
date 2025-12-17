import { Badge } from "@/components/ui/badge";
import { Globe, Mail, Palette, MessageSquare, Cog, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentInbox } from "./AgentInboxTabs";

interface ConversationContextHeaderProps {
  agentId: AgentInbox;
  agentName: string;
  channel: string;
  recipientInbox?: string | null;
  isExternal: boolean;
}

const AGENT_INFO: Record<AgentInbox, {
  displayName: string;
  shortRole: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  website: {
    displayName: 'Jordan',
    shortRole: 'Web Chat',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30'
  },
  hello: {
    displayName: 'Alex',
    shortRole: 'Quotes',
    icon: <Mail className="w-3.5 h-3.5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30'
  },
  design: {
    displayName: 'Grant',
    shortRole: 'Design',
    icon: <Palette className="w-3.5 h-3.5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30'
  },
  dms: {
    displayName: 'Casey',
    shortRole: 'Social',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30'
  },
  ops_desk: {
    displayName: 'Ops Desk',
    shortRole: 'Execution',
    icon: <Cog className="w-3.5 h-3.5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30'
  }
};

export function ConversationContextHeader({
  agentId,
  channel,
  recipientInbox,
  isExternal
}: ConversationContextHeaderProps) {
  const agentInfo = AGENT_INFO[agentId];
  
  const getChannelLabel = () => {
    if (channel === 'email' && recipientInbox) {
      return `${recipientInbox}@`;
    }
    return channel;
  };

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2 border-b transition-colors",
      agentInfo.bgColor
    )}>
      <div className="flex items-center gap-3">
        {/* Agent badge - simplified */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          "bg-white/60 dark:bg-black/20 border border-current/10"
        )}>
          <span className={agentInfo.color}>{agentInfo.icon}</span>
          <span className={cn("font-medium text-xs", agentInfo.color)}>
            {agentInfo.displayName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            • {agentInfo.shortRole}
          </span>
        </div>

        {/* Channel - minimal */}
        <span className="text-xs text-muted-foreground">
          via {getChannelLabel()}
        </span>
      </div>

      {/* External/Internal indicator - simplified */}
      <Badge 
        variant={isExternal ? "destructive" : "secondary"} 
        className={cn(
          "text-[10px] h-5 font-medium transition-all",
          !isExternal && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
        )}
      >
        {isExternal ? (
          <>
            <ExternalLink className="w-3 h-3 mr-1" />
            External
          </>
        ) : (
          <>
            <Shield className="w-3 h-3 mr-1" />
            Internal
          </>
        )}
      </Badge>
    </div>
  );
}
