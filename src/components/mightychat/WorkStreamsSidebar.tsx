import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Globe, Mail, Palette, MessageCircle, Cog, TrendingUp, AlertTriangle, Flame } from "lucide-react";

export type WorkStream = "website" | "quotes" | "design" | "dms" | "ops";

interface StreamConfig {
  id: WorkStream;
  label: string;
  shortDesc: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
}

const STREAMS: StreamConfig[] = [
  { 
    id: "website", 
    label: "Website Leads", 
    shortDesc: "Chat inquiries",
    icon: <Globe className="w-4 h-4" />,
    color: "text-blue-500",
    activeColor: "bg-blue-500/10 border-blue-500/50 text-blue-600 shadow-sm"
  },
  { 
    id: "quotes", 
    label: "Quotes", 
    shortDesc: "hello@ inbox",
    icon: <Mail className="w-4 h-4" />,
    color: "text-emerald-500",
    activeColor: "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 shadow-sm"
  },
  { 
    id: "design", 
    label: "Design", 
    shortDesc: "design@ inbox",
    icon: <Palette className="w-4 h-4" />,
    color: "text-purple-500",
    activeColor: "bg-purple-500/10 border-purple-500/50 text-purple-600 shadow-sm"
  },
  { 
    id: "dms", 
    label: "Social DMs", 
    shortDesc: "Instagram",
    icon: <MessageCircle className="w-4 h-4" />,
    color: "text-pink-500",
    activeColor: "bg-pink-500/10 border-pink-500/50 text-pink-600 shadow-sm"
  },
  { 
    id: "ops", 
    label: "Ops Desk", 
    shortDesc: "Approvals",
    icon: <Cog className="w-4 h-4" />,
    color: "text-amber-600",
    activeColor: "bg-amber-500/10 border-amber-500/50 text-amber-600 shadow-sm"
  },
];

interface WorkStreamsSidebarProps {
  activeStream: WorkStream;
  onStreamChange: (stream: WorkStream) => void;
  onOpenOpsDesk: () => void;
  counts?: {
    website?: number;
    quotes?: number;
    design?: number;
    dms?: number;
    ops?: number;
  };
  signals?: {
    quoteValue?: number;
    cxRiskCount?: number;
    hotLeads?: number;
    pendingReviews?: number;
  };
}

export function WorkStreamsSidebar({ 
  activeStream, 
  onStreamChange, 
  onOpenOpsDesk,
  counts = {},
  signals = {}
}: WorkStreamsSidebarProps) {
  const handleStreamClick = (stream: WorkStream) => {
    if (stream === "ops") {
      onOpenOpsDesk();
    } else {
      onStreamChange(stream);
    }
  };

  return (
    <div className="w-[180px] bg-card/50 border-r flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Work Streams
        </h3>
      </div>

      {/* Stream List */}
      <div className="flex-1 p-2 space-y-0.5">
        {STREAMS.map((stream) => {
          const isActive = activeStream === stream.id && stream.id !== "ops";
          const count = counts[stream.id] || 0;
          const isOps = stream.id === "ops";

          // Signal indicators
          const showRevenue = stream.id === 'quotes' && signals.quoteValue && signals.quoteValue > 0;
          const showCxRisk = stream.id === 'quotes' && signals.cxRiskCount && signals.cxRiskCount > 0;
          const showHotLead = stream.id === 'website' && signals.hotLeads && signals.hotLeads > 0;
          const showPendingReview = stream.id === 'design' && signals.pendingReviews && signals.pendingReviews > 0;
          const hasSignal = showRevenue || showCxRisk || showHotLead || showPendingReview;

          return (
            <button
              key={stream.id}
              onClick={() => handleStreamClick(stream.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 border border-transparent",
                "hover:bg-muted/60 hover:translate-x-0.5",
                isActive && stream.activeColor,
                isOps && "mt-3 border-dashed border-amber-300/50 dark:border-amber-700/50"
              )}
            >
              <span className={cn(
                "transition-colors",
                isActive ? "" : stream.color,
                isOps && "text-amber-600"
              )}>
                {stream.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-sm truncate",
                    isActive ? "font-medium" : "text-muted-foreground",
                    isOps && "font-medium text-amber-600"
                  )}>
                    {stream.label}
                  </span>
                  {count > 0 && (
                    <Badge 
                      variant={isOps ? "outline" : "secondary"}
                      className={cn(
                        "text-[10px] h-4 min-w-[16px] px-1",
                        isActive && !isOps && "bg-current/20",
                        isOps && "border-amber-400 text-amber-600"
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </div>
                
                {/* Signal indicators or description */}
                <div className="flex items-center gap-1 mt-0.5 min-h-[14px]">
                  {showHotLead && (
                    <span className="text-[9px] text-orange-500 flex items-center gap-0.5 animate-pulse">
                      <Flame className="w-2.5 h-2.5" />
                      {signals.hotLeads} hot
                    </span>
                  )}
                  {showRevenue && (
                    <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" />
                      ${(signals.quoteValue! / 1000).toFixed(0)}k
                    </span>
                  )}
                  {showCxRisk && (
                    <span className="text-[9px] text-red-500 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {signals.cxRiskCount}
                    </span>
                  )}
                  {showPendingReview && (
                    <span className="text-[9px] text-purple-500">
                      ⏳ {signals.pendingReviews} pending
                    </span>
                  )}
                  {!hasSignal && (
                    <span className="text-[9px] text-muted-foreground/70">
                      {stream.shortDesc}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <p className="text-[9px] text-muted-foreground/60 text-center">
          Focus on what matters
        </p>
      </div>
    </div>
  );
}

// Helper to map old AgentInbox types to WorkStream
export function mapInboxToStream(inbox: string): WorkStream {
  switch (inbox) {
    case "website": return "website";
    case "hello": return "quotes";
    case "design": return "design";
    case "dms": return "dms";
    case "ops_desk": return "ops";
    default: return "website";
  }
}

// Helper to map WorkStream back to AgentInbox for data queries
export function mapStreamToInbox(stream: WorkStream): string {
  switch (stream) {
    case "website": return "website";
    case "quotes": return "hello";
    case "design": return "design";
    case "dms": return "dms";
    case "ops": return "ops_desk";
    default: return "website";
  }
}
