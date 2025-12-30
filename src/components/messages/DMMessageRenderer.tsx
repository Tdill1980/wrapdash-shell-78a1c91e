import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Instagram, MessageSquare, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";

interface DMMessageRendererProps {
  message: {
    id: string;
    content: string;
    direction: string;
    channel: string;
    created_at: string | null;
    sender_name: string | null;
    metadata?: {
      avatar_url?: string;
      username?: string;
      author_type?: "ai" | "human" | "system";
      author_id?: string;
      generated_by?: string;
      attachments?: string[];
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

export function DMMessageRenderer({ message }: DMMessageRendererProps) {
  const metadata = message.metadata || {};
  const isOutbound = message.direction === "outbound";
  const isAI = metadata.author_type === "ai" || metadata.generated_by;
  const authorId = metadata.author_id || metadata.generated_by;
  const attachments = metadata.attachments || [];

  const getInitials = () => {
    if (message.sender_name) {
      return message.sender_name.slice(0, 2).toUpperCase();
    }
    if (metadata.username) {
      return metadata.username.slice(0, 2).toUpperCase();
    }
    return isOutbound ? "AI" : "??";
  };

  const ChannelIcon = message.channel === "instagram" ? Instagram : MessageSquare;

  return (
    <div className={cn(
      "flex gap-2",
      isOutbound ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={metadata.avatar_url} />
        <AvatarFallback className={cn(
          "text-xs",
          message.channel === "instagram" 
            ? "bg-gradient-to-br from-[#405DE6] to-[#E1306C] text-white"
            : "bg-muted"
        )}>
          {getInitials()}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] space-y-1",
        isOutbound ? "items-end" : "items-start"
      )}>
        {/* Author info */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isOutbound ? "justify-end" : "justify-start"
        )}>
          {isAI ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-500 border-purple-500/30">
              🤖 {authorId ? getAgentDisplayName(authorId) : "AI"}
            </Badge>
          ) : isOutbound ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-500 border-blue-500/30">
              👤 Human
            </Badge>
          ) : (
            <span>{message.sender_name || metadata.username || "Customer"}</span>
          )}
          <span className="flex items-center gap-1">
            <ChannelIcon className="w-3 h-3" />
            {message.created_at ? formatTimeAZ(message.created_at) : ""}
          </span>
        </div>

        {/* Message bubble */}
        <div className={cn(
          "rounded-lg p-3",
          isOutbound 
            ? isAI 
              ? "bg-purple-500/10 border border-purple-500/30"
              : "bg-primary text-primary-foreground"
            : "bg-muted border border-border"
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((url, idx) => {
              const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)/i);
              const isVideo = url.match(/\.(mp4|mov|webm)/i);
              
              if (isImage) {
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <img
                      src={url}
                      alt={`Attachment ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                  </a>
                );
              }
              
              if (isVideo) {
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-24 h-24 flex items-center justify-center bg-muted rounded-lg border hover:bg-muted/80"
                  >
                    <span className="text-2xl">🎬</span>
                  </a>
                );
              }
              
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs hover:bg-muted/80"
                >
                  <ExternalLink className="w-3 h-3" />
                  File {idx + 1}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
