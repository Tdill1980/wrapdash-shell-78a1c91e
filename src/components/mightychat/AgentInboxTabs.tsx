import { Globe, Mail, Palette, MessageSquare, Cog } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentInbox = 'website' | 'hello' | 'design' | 'dms' | 'ops_desk';

interface AgentInboxTabsProps {
  activeInbox: AgentInbox;
  onInboxChange: (inbox: AgentInbox) => void;
  counts?: Record<AgentInbox, number>;
  allowedInboxes?: AgentInbox[];
}

interface InboxConfig {
  id: AgentInbox;
  label: string;
  agent: string;
  icon: React.ReactNode;
  color: string;
  bgActive: string;
  borderColor: string;
}

const INBOX_CONFIGS: InboxConfig[] = [
  {
    id: 'website',
    label: 'Website',
    agent: 'Jordan',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-blue-600',
    bgActive: 'bg-blue-100 dark:bg-blue-900/40',
    borderColor: 'border-blue-500'
  },
  {
    id: 'hello',
    label: 'hello@',
    agent: 'Alex',
    icon: <Mail className="w-4 h-4" />,
    color: 'text-green-600',
    bgActive: 'bg-green-100 dark:bg-green-900/40',
    borderColor: 'border-green-500'
  },
  {
    id: 'design',
    label: 'design@',
    agent: 'Grant',
    icon: <Palette className="w-4 h-4" />,
    color: 'text-purple-600',
    bgActive: 'bg-purple-100 dark:bg-purple-900/40',
    borderColor: 'border-purple-500'
  },
  {
    id: 'dms',
    label: 'Affiliates',
    agent: 'Casey',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-pink-600',
    bgActive: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30',
    borderColor: 'border-pink-500'
  },
  {
    id: 'ops_desk',
    label: 'Ops Desk',
    agent: 'Ops',
    icon: <Cog className="w-4 h-4" />,
    color: 'text-red-600',
    bgActive: 'bg-red-100 dark:bg-red-900/40',
    borderColor: 'border-red-500'
  }
];

export function AgentInboxTabs({ 
  activeInbox, 
  onInboxChange, 
  counts = {} as Record<AgentInbox, number>,
  allowedInboxes 
}: AgentInboxTabsProps) {
  const visibleInboxes = allowedInboxes 
    ? INBOX_CONFIGS.filter(c => allowedInboxes.includes(c.id))
    : INBOX_CONFIGS;

  return (
    <div className="flex border-b bg-background">
      {visibleInboxes.map((config) => {
        const isActive = activeInbox === config.id;
        const count = counts[config.id] || 0;
        
        return (
          <button
            key={config.id}
            onClick={() => onInboxChange(config.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[2px]",
              isActive 
                ? `${config.bgActive} ${config.color} ${config.borderColor}` 
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span className={config.color}>{config.icon}</span>
            <span className="hidden sm:inline">{config.label}</span>
            <span className="text-[10px] text-muted-foreground">({config.agent})</span>
            {count > 0 && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                config.id === 'ops_desk' 
                  ? "bg-red-600 text-white animate-pulse" 
                  : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function getInboxConfig(inbox: AgentInbox): InboxConfig | undefined {
  return INBOX_CONFIGS.find(c => c.id === inbox);
}

export { INBOX_CONFIGS };
