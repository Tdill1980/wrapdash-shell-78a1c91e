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
  fullRole: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  website: {
    displayName: 'Jordan Lee',
    shortRole: 'Sales',
    fullRole: 'Website Chat Agent',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  hello: {
    displayName: 'Alex Morgan',
    shortRole: 'Quotes',
    fullRole: 'Quote & Email Agent',
    icon: <Mail className="w-4 h-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  design: {
    displayName: 'Grant Miller',
    shortRole: 'Design',
    fullRole: 'Design Review Agent',
    icon: <Palette className="w-4 h-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  dms: {
    displayName: 'Casey Ramirez',
    shortRole: 'Affiliates',
    fullRole: 'Affiliate Manager',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30'
  },
  ops_desk: {
    displayName: 'Ops Desk',
    shortRole: 'Ops',
    fullRole: 'Operations Coordinator',
    icon: <Cog className="w-4 h-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  }
};

export function ConversationContextHeader({
  agentId,
  channel,
  recipientInbox,
  isExternal
}: ConversationContextHeaderProps) {
  const agentInfo = AGENT_INFO[agentId];
  
  const getInboxLabel = () => {
    if (channel === 'email' && recipientInbox) {
      return `${recipientInbox}@weprintwraps.com`;
    }
    if (channel === 'instagram') return 'Instagram DMs';
    if (channel === 'website') return 'Website Chat';
    return channel;
  };

  const getChannelIcon = () => {
    if (channel === 'email') return <Mail className="w-3.5 h-3.5" />;
    if (channel === 'instagram') return <MessageSquare className="w-3.5 h-3.5" />;
    if (channel === 'website') return <Globe className="w-3.5 h-3.5" />;
    return null;
  };

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2.5 border-b transition-colors",
      agentInfo.bgColor,
      agentInfo.borderColor
    )}>
      <div className="flex items-center gap-4">
        {/* Agent Identity - More Prominent */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "bg-background/80 border",
          agentInfo.borderColor
        )}>
          <div className={cn("p-1 rounded-md", agentInfo.bgColor)}>
            <span className={agentInfo.color}>{agentInfo.icon}</span>
          </div>
          <div className="flex flex-col">
            <span className={cn("font-semibold text-sm leading-tight", agentInfo.color)}>
              {agentInfo.displayName}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {agentInfo.fullRole}
            </span>
          </div>
        </div>

        {/* Inbox/Channel */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {getChannelIcon()}
          <span className="font-medium">{getInboxLabel()}</span>
        </div>
      </div>

      {/* External/Internal indicator */}
      <Badge 
        variant={isExternal ? "destructive" : "secondary"} 
        className={cn(
          "text-[10px] h-6 font-medium transition-all gap-1",
          !isExternal && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-300"
        )}
      >
        {isExternal ? (
          <>
            <ExternalLink className="w-3 h-3" />
            External Thread
          </>
        ) : (
          <>
            <Shield className="w-3 h-3" />
            Internal
          </>
        )}
      </Badge>
    </div>
  );
}
