import { Badge } from "@/components/ui/badge";
import { Bot, User, Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";

interface ChatMessageRendererProps {
  message: {
    id: string;
    content: string;
    direction: string;
    channel: string;
    created_at: string | null;
    sender_name: string | null;
    metadata?: {
      author_type?: "ai" | "human" | "system";
      author_id?: string;
      generated_by?: string;
      [key: string]: unknown;
    } | null;
  };
}

// Map agent IDs to display names
const getAgentDisplayName = (agentId: string): string => {
  const agentNames: Record<string, string> = {
    casey_ramirez: "Casey Ramirez",
    alex_morgan: "Alex Morgan",
    grant_miller: "Grant Miller",
    jordan_lee: "Jordan Lee",
    taylor_brooks: "Taylor Brooks",
    evan_porter: "Evan Porter",
    emily_carter: "Emily Carter",
    noah_bennett: "Noah Bennett",
    ryan_mitchell: "Ryan Mitchell"
  };
  return agentNames[agentId] || agentId;
};

export function ChatMessageRenderer({ message }: ChatMessageRendererProps) {
  const metadata = message.metadata || {};
  const isOutbound = message.direction === "outbound";
  const authorType = metadata.author_type || (metadata.generated_by ? "ai" : isOutbound ? "human" : "system");
  const authorId = metadata.author_id || metadata.generated_by;

  const getAuthorIcon = () => {
    switch (authorType) {
      case "ai":
        return <Bot className="w-3 h-3" />;
      case "human":
        return <User className="w-3 h-3" />;
      case "system":
        return <Cog className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getAuthorLabel = () => {
    if (authorType === "ai" && authorId) {
      return `🤖 ${getAgentDisplayName(authorId)}`;
    }
    if (authorType === "ai") {
      return "🤖 AI";
    }
    if (authorType === "human") {
      return `👤 ${message.sender_name || authorId || "Human"}`;
    }
    return "⚙️ System";
  };

  const getAuthorStyle = () => {
    switch (authorType) {
      case "ai":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "human":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "system":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2",
      authorType === "ai" && "bg-purple-500/5 border-purple-500/20",
      authorType === "human" && "bg-blue-500/5 border-blue-500/20",
      authorType === "system" && "bg-muted/50 border-border"
    )}>
      {/* Header with author info */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn("text-xs", getAuthorStyle())}>
          {getAuthorIcon()}
          <span className="ml-1">{getAuthorLabel()}</span>
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {message.created_at ? formatTimeAZ(message.created_at) : ""}
        </span>
      </div>

      {/* Message content */}
      <div className="text-sm whitespace-pre-wrap break-words">
        {message.content}
      </div>
    </div>
  );
}
