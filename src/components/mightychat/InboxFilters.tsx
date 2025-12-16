import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageCircle, 
  Instagram, 
  Inbox,
  Palette,
  User,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type InboxFilter = 'all' | 'hello' | 'design' | 'jackson' | 'instagram' | 'website' | 'quotes';

interface InboxFiltersProps {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  counts?: {
    all?: number;
    hello?: number;
    design?: number;
    jackson?: number;
    instagram?: number;
    website?: number;
    pendingQuotes?: number;
  };
}

const filterConfig: Record<InboxFilter, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  all: {
    label: 'All',
    icon: <Inbox className="w-3.5 h-3.5" />,
    color: 'text-foreground',
    bgColor: 'bg-muted'
  },
  hello: {
    label: 'Hello',
    icon: <Mail className="w-3.5 h-3.5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  design: {
    label: 'Design',
    icon: <Palette className="w-3.5 h-3.5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  jackson: {
    label: 'Jackson',
    icon: <User className="w-3.5 h-3.5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  instagram: {
    label: 'Instagram',
    icon: <Instagram className="w-3.5 h-3.5" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30'
  },
  website: {
    label: 'Website',
    icon: <MessageCircle className="w-3.5 h-3.5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  quotes: {
    label: 'Quote Requests',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  }
};

export function InboxFilters({ activeFilter, onFilterChange, counts }: InboxFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg border">
      {(Object.entries(filterConfig) as [InboxFilter, typeof filterConfig[InboxFilter]][]).map(([key, config]) => {
        const count = key === 'quotes' ? counts?.pendingQuotes : counts?.[key as keyof typeof counts];
        const isActive = activeFilter === key;
        const isQuotes = key === 'quotes';
        
        return (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(key)}
            className={cn(
              "h-7 px-2 text-xs font-medium transition-all",
              isActive && config.bgColor,
              isActive && config.color,
              !isActive && "text-muted-foreground hover:text-foreground",
              isQuotes && count && count > 0 && "animate-pulse border-red-500 border"
            )}
          >
            <span className={cn("mr-1", config.color)}>
              {config.icon}
            </span>
            {config.label}
            {count !== undefined && count > 0 && (
              <Badge 
                variant={isQuotes ? "destructive" : "secondary"} 
                className={cn(
                  "ml-1 h-4 min-w-[16px] px-1 text-[10px]",
                  isQuotes && "bg-red-600 text-white"
                )}
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Agent badge component for conversation items
export function AgentBadge({ channel, recipientInbox }: { channel: string; recipientInbox?: string | null }) {
  const getAgentInfo = () => {
    if (channel === 'instagram') {
      return { label: 'IG', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
    }
    if (channel === 'website') {
      return { label: 'Luigi', color: 'bg-green-500 text-white' };
    }
    if (channel === 'email') {
      if (recipientInbox?.includes('design')) {
        return { label: 'Design', color: 'bg-purple-500 text-white' };
      }
      if (recipientInbox?.includes('jackson')) {
        return { label: 'Jackson', color: 'bg-orange-500 text-white' };
      }
      return { label: 'Hello', color: 'bg-blue-500 text-white' };
    }
    return { label: channel.slice(0, 2).toUpperCase(), color: 'bg-muted text-muted-foreground' };
  };

  const { label, color } = getAgentInfo();

  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", color)}>
      {label}
    </span>
  );
}

// Quote status indicator
export function QuoteStatusBadge({ reviewStatus }: { reviewStatus?: string | null }) {
  if (!reviewStatus || reviewStatus === 'sent') return null;

  const config = {
    pending_review: { label: 'NEEDS REVIEW', className: 'bg-red-600 text-white animate-pulse' },
    reviewed: { label: 'REVIEWED', className: 'bg-yellow-500 text-black' },
    approved: { label: 'APPROVED', className: 'bg-green-500 text-white' }
  };

  const status = config[reviewStatus as keyof typeof config];
  if (!status) return null;

  return (
    <Badge className={cn("text-[9px] px-1 h-4", status.className)}>
      {status.label}
    </Badge>
  );
}
