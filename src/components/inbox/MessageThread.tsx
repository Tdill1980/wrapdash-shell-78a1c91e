import { useState } from "react";
import { Send, Paperclip, MoreVertical, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Message, Conversation, Contact } from "@/hooks/useInbox";

interface MessageThreadProps {
  conversation: (Conversation & { contact: Contact }) | undefined;
  messages: Message[] | undefined;
  onSendMessage: (content: string) => void;
  onUpdateStatus: (status: string) => void;
  isSending: boolean;
}

export const MessageThread = ({
  conversation,
  messages,
  onSendMessage,
  onUpdateStatus,
  isSending,
}: MessageThreadProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center">
          <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background/50">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
            {conversation.contact?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-semibold">{conversation.contact?.name || "Unknown"}</h3>
            <p className="text-sm text-muted-foreground">
              {conversation.subject || conversation.contact?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            {conversation.channel === "email" ? (
              <Mail className="w-3 h-3" />
            ) : (
              <MessageSquare className="w-3 h-3" />
            )}
            {conversation.channel}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateStatus("open")}>
                Mark as Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("pending")}>
                Mark as Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("closed")}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Close Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}

          {messages?.map((message) => {
            const isOutbound = message.direction === "outbound";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isOutbound ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5",
                    isOutbound
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={cn(
                    "flex items-center gap-2 mt-1 text-[10px]",
                    isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    <span>{format(new Date(message.created_at), "h:mm a")}</span>
                    {message.status === "delivered" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Compose */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
