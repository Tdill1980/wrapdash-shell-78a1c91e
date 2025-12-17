import { useChannelStatus, ChannelStatus } from "@/hooks/useChannelStatus";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";

function StatusBadge({ status }: { status: ChannelStatus["status"] }) {
  const config = {
    live: { label: "LIVE", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    stale: { label: "STALE", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    empty: { label: "NO DATA", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    not_connected: { label: "NOT CONNECTED", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  const { label, className } = config[status];

  return (
    <span className={cn(
      "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide",
      className
    )}>
      {label}
    </span>
  );
}

function ChannelItem({ channel }: { channel: ChannelStatus }) {
  return (
    <div className="py-2 px-3 rounded-lg bg-background/50 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base mt-0.5">{channel.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {channel.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {channel.owner} • {channel.ownerRole}
            </p>
          </div>
        </div>
        <StatusBadge status={channel.status} />
      </div>
      
      {/* Status details */}
      <div className="mt-2 ml-6 text-xs">
        {channel.status === "live" && channel.lastMessageAt && (
          <p className="text-green-400">
            ✓ Last message: {channel.lastMessageAt}
          </p>
        )}
        {channel.status === "stale" && channel.lastMessageAt && (
          <p className="text-amber-400">
            ⚠ Last message: {channel.lastMessageAt}
          </p>
        )}
        {channel.status === "empty" && (
          <p className="text-amber-400">
            ⚠ Connected but no messages received
          </p>
        )}
        {channel.status === "not_connected" && (
          <p className="text-red-400">
            ✗ {channel.notes || "Channel not configured"}
          </p>
        )}
        {channel.notes && channel.status !== "not_connected" && (
          <p className="text-muted-foreground mt-1">
            {channel.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function ChannelsPanel() {
  const { channels, loading } = useChannelStatus();
  const [isOpen, setIsOpen] = useState(true);

  const connectedCount = channels.filter(c => c.status === "live" || c.status === "stale").length;
  const totalCount = channels.length;

  if (loading) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">Loading channels...</p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Channels & Inboxes
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {connectedCount}/{totalCount} live
          </span>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="space-y-2 px-2 pb-4">
          {channels.map((channel) => (
            <ChannelItem key={channel.id} channel={channel} />
          ))}
          
          {/* Facebook setup hint */}
          <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs font-medium text-blue-400 mb-1">
              📘 Enable Facebook Messages
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              FB Messages require separate Meta Messenger permissions (pages_messaging, pages_read_engagement).
            </p>
            <a 
              href="https://developers.facebook.com/apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Meta App Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
