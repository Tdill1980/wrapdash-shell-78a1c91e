import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Globe, Mail, Palette, MessageCircle, Cog } from "lucide-react";

export type WorkStream = "website" | "quotes" | "design" | "dms" | "ops";

interface StreamConfig {
  id: WorkStream;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
}

const STREAMS: StreamConfig[] = [
  { 
    id: "website", 
    label: "Website Leads", 
    icon: <Globe className="w-4 h-4" />,
    color: "text-blue-500",
    activeColor: "bg-blue-500/10 border-blue-500 text-blue-600"
  },
  { 
    id: "quotes", 
    label: "Quotes Waiting", 
    icon: <Mail className="w-4 h-4" />,
    color: "text-green-500",
    activeColor: "bg-green-500/10 border-green-500 text-green-600"
  },
  { 
    id: "design", 
    label: "Design Reviews", 
    icon: <Palette className="w-4 h-4" />,
    color: "text-purple-500",
    activeColor: "bg-purple-500/10 border-purple-500 text-purple-600"
  },
  { 
    id: "dms", 
    label: "Social DMs", 
    icon: <MessageCircle className="w-4 h-4" />,
    color: "text-pink-500",
    activeColor: "bg-pink-500/10 border-pink-500 text-pink-600"
  },
  { 
    id: "ops", 
    label: "Ops Desk", 
    icon: <Cog className="w-4 h-4" />,
    color: "text-red-600",
    activeColor: "bg-red-500/10 border-red-500 text-red-600"
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
}

export function WorkStreamsSidebar({ 
  activeStream, 
  onStreamChange, 
  onOpenOpsDesk,
  counts = {}
}: WorkStreamsSidebarProps) {
  const handleStreamClick = (stream: WorkStream) => {
    if (stream === "ops") {
      onOpenOpsDesk();
    } else {
      onStreamChange(stream);
    }
  };

  return (
    <div className="w-[200px] bg-card border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Work Streams
        </h3>
      </div>

      {/* Stream List */}
      <div className="flex-1 p-2 space-y-1">
        {STREAMS.map((stream) => {
          const isActive = activeStream === stream.id && stream.id !== "ops";
          const count = counts[stream.id] || 0;
          const isOps = stream.id === "ops";

          return (
            <button
              key={stream.id}
              onClick={() => handleStreamClick(stream.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all border border-transparent",
                "hover:bg-muted/50",
                isActive && stream.activeColor,
                isOps && "mt-4 border-dashed border-red-300 dark:border-red-800"
              )}
            >
              <span className={cn(
                isActive ? "" : stream.color,
                isOps && "text-red-600"
              )}>
                {stream.icon}
              </span>
              <span className={cn(
                "text-sm flex-1",
                isActive ? "font-medium" : "text-muted-foreground",
                isOps && "font-medium text-red-600"
              )}>
                {stream.label}
              </span>
              {count > 0 && (
                <Badge 
                  variant={isOps ? "destructive" : "secondary"}
                  className={cn(
                    "text-[10px] h-5 min-w-[20px]",
                    isActive && !isOps && "bg-current/20"
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-[10px] text-muted-foreground text-center">
          Select a stream to focus
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
