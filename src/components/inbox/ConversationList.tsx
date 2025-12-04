import { Mail, MessageSquare, Phone, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, Contact } from "@/hooks/useInbox";

interface ConversationListProps {
  conversations: (Conversation & { contact: Contact })[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  internal_chat: Phone,
};

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-muted text-muted-foreground",
  low: "bg-muted/50 text-muted-foreground",
};

export const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  searchQuery,
  onSearchChange,
}: ConversationListProps) => {
  const filteredConversations = conversations?.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.contact?.name?.toLowerCase().includes(searchLower) ||
      conv.contact?.email?.toLowerCase().includes(searchLower) ||
      conv.subject?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Inbox</h2>
          <Button size="sm" onClick={onNewConversation} className="gap-1">
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
          
          {filteredConversations?.map((conversation) => {
            const ChannelIcon = channelIcons[conversation.channel] || Mail;
            const isSelected = selectedId === conversation.id;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all",
                  "hover:bg-accent/50",
                  isSelected && "bg-accent border border-primary/30"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar/Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                    "bg-primary/20 text-primary"
                  )}>
                    {conversation.contact?.name?.charAt(0).toUpperCase() || "?"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {conversation.contact?.name || "Unknown"}
                      </span>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      <ChannelIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {conversation.subject || conversation.contact?.email || "No subject"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          {conversation.unread_count}
                        </Badge>
                      )}
                      {conversation.priority !== "normal" && (
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5 py-0", priorityColors[conversation.priority])}
                        >
                          {conversation.priority}
                        </Badge>
                      )}
                      {conversation.status === "pending" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-400">
                          pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
