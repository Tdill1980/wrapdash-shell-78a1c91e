import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Globe, Mail, Palette, MessageCircle, Cog, TrendingUp, AlertTriangle, Flame, Users, ChevronDown, ChevronRight, Phone } from "lucide-react";
import { useState } from "react";

export type WorkStream = "hello" | "design" | "jackson" | "dms" | "ops" | "website" | "phone";

interface StreamConfig {
  id: WorkStream;
  label: string;
  agentName: string;
  inboxLabel: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  isEmailInbox?: boolean;
}

const STREAMS: StreamConfig[] = [
  { 
    id: "hello", 
    label: "hello@ Inbox", 
    agentName: "Alex Morgan",
    inboxLabel: "hello@weprintwraps.com",
    icon: <Mail className="w-4 h-4" />,
    color: "text-emerald-500",
    activeColor: "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 shadow-sm",
    isEmailInbox: true
  },
  { 
    id: "design", 
    label: "design@ Inbox", 
    agentName: "Grant Miller",
    inboxLabel: "design@weprintwraps.com",
    icon: <Palette className="w-4 h-4" />,
    color: "text-purple-500",
    activeColor: "bg-purple-500/10 border-purple-500/50 text-purple-600 shadow-sm",
    isEmailInbox: true
  },
  { 
    id: "jackson", 
    label: "jackson@ Inbox", 
    agentName: "Jackson (Ops)",
    inboxLabel: "jackson@weprintwraps.com",
    icon: <Mail className="w-4 h-4" />,
    color: "text-orange-500",
    activeColor: "bg-orange-500/10 border-orange-500/50 text-orange-600 shadow-sm",
    isEmailInbox: true
  },
  { 
    id: "dms", 
    label: "Social DMs", 
    agentName: "Casey Ramirez",
    inboxLabel: "Instagram / Facebook",
    icon: <MessageCircle className="w-4 h-4" />,
    color: "text-pink-500",
    activeColor: "bg-pink-500/10 border-pink-500/50 text-pink-600 shadow-sm"
  },
  { 
    id: "website", 
    label: "Website Chat", 
    agentName: "Jordan Lee",
    inboxLabel: "weprintwraps.com",
    icon: <Globe className="w-4 h-4" />,
    color: "text-cyan-500",
    activeColor: "bg-cyan-500/10 border-cyan-500/50 text-cyan-600 shadow-sm"
  },
  { 
    id: "phone", 
    label: "Phone Calls", 
    agentName: "Taylor Phone",
    inboxLabel: "AI Phone Agent",
    icon: <Phone className="w-4 h-4" />,
    color: "text-amber-500",
    activeColor: "bg-amber-500/10 border-amber-500/50 text-amber-600 shadow-sm"
  },
  { 
    id: "ops", 
    label: "Ops Desk", 
    agentName: "Ops Desk",
    inboxLabel: "Approvals & Routing",
    icon: <Cog className="w-4 h-4" />,
    color: "text-amber-600",
    activeColor: "bg-amber-500/10 border-amber-500/50 text-amber-600 shadow-sm"
  },
];

// Role-bound agents (invoked by Ops Desk, not channel-bound)
const ROLE_AGENTS = [
  { name: "Taylor Brooks", role: "Partnerships & Field Ops" },
  { name: "Evan Porter", role: "Affiliate Operations" },
  { name: "Emily Carter", role: "Marketing Content" },
  { name: "Noah Bennett", role: "Social Content" },
  { name: "Ryan Mitchell", role: "Editorial Authority" },
  { name: "MightyTask", role: "Task Execution" },
];

interface WorkStreamsSidebarProps {
  activeStream: WorkStream;
  onStreamChange: (stream: WorkStream) => void;
  onOpenOpsDesk: () => void;
  counts?: {
    hello?: number;
    design?: number;
    jackson?: number;
    dms?: number;
    ops?: number;
    website?: number;
    phone?: number;
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
  const [showTeam, setShowTeam] = useState(false);

  const handleStreamClick = (stream: WorkStream) => {
    if (stream === "ops") {
      onOpenOpsDesk();
    } else {
      onStreamChange(stream);
    }
  };

  return (
    <div className="w-[220px] bg-card/50 border-r flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Work Streams
        </h3>
      </div>

      {/* Stream List */}
      <div className="flex-1 p-2 space-y-1">
        {STREAMS.map((stream) => {
          const isActive = activeStream === stream.id && stream.id !== "ops";
          const count = counts[stream.id] || 0;
          const isOps = stream.id === "ops";

          // Signal indicators
          const showRevenue = stream.id === 'hello' && signals.quoteValue && signals.quoteValue > 0;
          const showCxRisk = stream.id === 'hello' && signals.cxRiskCount && signals.cxRiskCount > 0;
          const showHotLead = false;
          const showPendingReview = stream.id === 'design' && signals.pendingReviews && signals.pendingReviews > 0;
          const hasSignal = showRevenue || showCxRisk || showHotLead || showPendingReview;

          return (
            <button
              key={stream.id}
              onClick={() => handleStreamClick(stream.id)}
              className={cn(
                "w-full flex flex-col px-3 py-2.5 rounded-lg text-left transition-all duration-200 border border-transparent",
                "hover:bg-muted/60 hover:translate-x-0.5",
                isActive && stream.activeColor,
                isOps && "mt-3 border-dashed border-amber-300/50 dark:border-amber-700/50"
              )}
            >
              {/* Top row: icon + label + count */}
              <div className="flex items-center gap-2 w-full">
                <span className={cn(
                  "transition-colors flex-shrink-0",
                  isActive ? "" : stream.color,
                  isOps && "text-amber-600"
                )}>
                  {stream.icon}
                </span>
                <span className={cn(
                  "text-sm truncate flex-1",
                  isActive ? "font-medium" : "text-muted-foreground",
                  isOps && "font-medium text-amber-600"
                )}>
                  {stream.label}
                </span>
                {count > 0 && (
                  <Badge 
                    variant={isOps ? "outline" : "secondary"}
                    className={cn(
                      "text-[10px] h-4 min-w-[16px] px-1 flex-shrink-0",
                      isActive && !isOps && "bg-current/20",
                      isOps && "border-amber-400 text-amber-600"
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </div>

              {/* Agent name + inbox */}
              <div className="mt-1 pl-6">
                <div className="text-[11px] font-medium text-foreground/80">
                  {stream.agentName}
                </div>
                <div className="text-[9px] text-muted-foreground truncate">
                  {stream.inboxLabel}
                </div>
              </div>

              {/* Signal indicators */}
              {hasSignal && (
                <div className="flex items-center gap-1.5 mt-1.5 pl-6">
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
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Team Directory (collapsible) */}
      <div className="border-t">
        <button 
          onClick={() => setShowTeam(!showTeam)}
          className="w-full px-4 py-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50"
        >
          <Users className="w-3 h-3" />
          <span>Role-Bound Agents</span>
          <span className="ml-auto text-[10px]">{showTeam ? '−' : '+'}</span>
        </button>
        
        {showTeam && (
          <div className="px-3 pb-3 space-y-1">
            {ROLE_AGENTS.map((agent) => (
              <div key={agent.name} className="px-2 py-1.5 rounded bg-muted/30">
                <div className="text-[10px] font-medium text-foreground/80">{agent.name}</div>
                <div className="text-[9px] text-muted-foreground">{agent.role}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



// Helper to map old AgentInbox types to WorkStream
export function mapInboxToStream(inbox: string): WorkStream {
  switch (inbox) {
    case "hello": return "hello";
    case "design": return "design";
    case "jackson": return "jackson";
    case "dms": return "dms";
    case "ops_desk": return "ops";
    case "website": return "website";
    case "phone": return "phone";
    default: return "hello";
  }
}

// Helper to map WorkStream back to AgentInbox for data queries
export function mapStreamToInbox(stream: WorkStream): string {
  switch (stream) {
    case "hello": return "hello";
    case "design": return "design";
    case "jackson": return "jackson";
    case "dms": return "dms";
    case "ops": return "ops_desk";
    case "website": return "website";
    case "phone": return "phone";
    default: return "hello";
  }
}
