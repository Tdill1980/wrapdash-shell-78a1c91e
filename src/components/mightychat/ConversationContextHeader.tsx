import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Mail, Palette, MessageSquare, Cog, Shield, AlertTriangle } from "lucide-react";
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
  role: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  canDo: string[];
  cantDo: string[];
}> = {
  website: {
    displayName: 'Jordan Lee',
    role: 'Website Chat',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    canDo: ['Answer questions', 'Qualify leads', 'Route to quotes'],
    cantDo: ['Quote pricing', 'Design work', 'Commit partnerships']
  },
  hello: {
    displayName: 'Alex Morgan',
    role: 'Quotes & Customer Service',
    icon: <Mail className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    canDo: ['Send quotes', 'Answer pricing', 'Enforce policies'],
    cantDo: ['Review files', 'Design work', 'Commit partnerships']
  },
  design: {
    displayName: 'Grant Miller',
    role: 'Design Ops',
    icon: <Palette className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    canDo: ['Review files', 'Preflight checks', 'Create ApproveFlow projects'],
    cantDo: ['Quote pricing', 'Commit partnerships', 'Talk to customers about pricing']
  },
  dms: {
    displayName: 'Casey Ramirez',
    role: 'Social Media',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30',
    canDo: ['Reply to DMs', 'Route leads', 'Create content tasks'],
    cantDo: ['Quote pricing', 'Design decisions', 'Commit partnerships']
  },
  ops_desk: {
    displayName: 'Ops Desk',
    role: 'Execution Gateway',
    icon: <Cog className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    canDo: ['Execute tasks', 'Create MightyTasks', 'Escalate blockers'],
    cantDo: ['Decide', 'Talk to customers', 'Commit anything']
  }
};

export function ConversationContextHeader({
  agentId,
  agentName,
  channel,
  recipientInbox,
  isExternal
}: ConversationContextHeaderProps) {
  const agentInfo = AGENT_INFO[agentId];
  
  const getChannelLabel = () => {
    if (channel === 'email' && recipientInbox) {
      return `${recipientInbox}@weprintwraps.com`;
    }
    return channel;
  };

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2 border-b",
      agentInfo.bgColor
    )}>
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                agentInfo.bgColor,
                "border border-current/20"
              )}>
                <span className={agentInfo.color}>{agentInfo.icon}</span>
                <span className={cn("font-semibold text-sm", agentInfo.color)}>
                  {agentInfo.displayName}
                </span>
                <Badge variant="outline" className="text-[10px] h-5">
                  {agentInfo.role}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-semibold">{agentInfo.displayName}</p>
                <div>
                  <p className="text-xs text-green-600 font-medium">Can do:</p>
                  <ul className="text-xs list-disc list-inside">
                    {agentInfo.canDo.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-red-600 font-medium">Cannot do:</p>
                  <ul className="text-xs list-disc list-inside">
                    {agentInfo.cantDo.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Badge variant="outline" className={cn("text-xs", agentInfo.color)}>
          Channel: {getChannelLabel()}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {isExternal ? (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            EXTERNAL
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/40">
            <Shield className="w-3 h-3" />
            INTERNAL
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px]">
          Execution: Via Ops Desk
        </Badge>
      </div>
    </div>
  );
}
