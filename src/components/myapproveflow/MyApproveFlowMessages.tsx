// ============================================
// MyApproveFlow Messages - Customer Chat
// ============================================

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Palette } from "lucide-react";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  created_at: string;
}

interface MyApproveFlowMessagesProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isApproved: boolean;
}

export function MyApproveFlowMessages({ messages, onSendMessage, isApproved }: MyApproveFlowMessagesProps) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await onSendMessage(newMessage);
    setNewMessage("");
    setSending(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message List */}
        <ScrollArea className="h-64 rounded-lg border border-border bg-muted/20 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isCustomer = msg.sender === "customer";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isCustomer ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCustomer ? "bg-primary/10" : "bg-secondary"
                    }`}>
                      {isCustomer ? (
                        <User className="h-4 w-4 text-primary" />
                      ) : (
                        <Palette className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`flex-1 ${isCustomer ? "text-right" : ""}`}>
                      <div className={`inline-block rounded-lg px-3 py-2 max-w-[80%] ${
                        isCustomer 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-foreground"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(msg.created_at), "MMM d 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Send Message */}
        {!isApproved && (
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message to the design team..."
              rows={2}
              className="bg-background border-border text-foreground resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isApproved && (
          <p className="text-sm text-muted-foreground text-center">
            This design has been approved. Contact support if you have questions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
