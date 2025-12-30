import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ExternalLink, 
  Send, 
  Mail, 
  MessageSquare, 
  Instagram,
  User,
  Car,
  DollarSign,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  direction: string;
  channel: string;
  content: string;
  created_at: string;
}

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  product_name?: string;
  sqft?: number;
  total_price: number;
  status: string;
  source?: string;
  source_conversation_id?: string;
  created_at: string;
}

interface QuoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
  onRefresh?: () => void;
}

export function QuoteDetailDialog({ open, onOpenChange, quote, onRefresh }: QuoteDetailDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);

  useEffect(() => {
    if (open && quote?.source_conversation_id) {
      fetchConversationMessages();
    } else {
      setMessages([]);
    }
  }, [open, quote?.source_conversation_id]);

  const fetchConversationMessages = async () => {
    if (!quote?.source_conversation_id) return;
    
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, direction, channel, content, created_at")
        .eq("conversation_id", quote.source_conversation_id)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw error;
      setMessages(data || []);
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openInMightyChat = () => {
    if (quote?.source_conversation_id) {
      window.open(`/mighty-chat?conversation=${quote.source_conversation_id}`, "_blank");
    }
  };

  const sendQuote = async () => {
    if (!quote) return;
    
    setSendingQuote(true);
    try {
      // Determine channel based on source
      const channel = quote.source === "instagram" ? "instagram" : "email";
      const actionType = channel === "instagram" ? "dm_send" : "email_send";

      // Create AI action to send the quote
      const { error } = await supabase.from("ai_actions").insert({
        action_type: actionType,
        conversation_id: quote.source_conversation_id,
        channel: channel,
        status: "pending",
        preview: `Quote #${quote.quote_number}: $${quote.total_price.toFixed(2)} for ${quote.vehicle_year} ${quote.vehicle_make} ${quote.vehicle_model}`,
        action_payload: {
          quote_id: quote.id,
          quote_number: quote.quote_number,
          customer_email: quote.customer_email,
          customer_name: quote.customer_name,
          vehicle: `${quote.vehicle_year} ${quote.vehicle_make} ${quote.vehicle_model}`,
          total_price: quote.total_price,
          product_name: quote.product_name,
        }
      });

      if (error) throw error;

      toast.success("Quote queued for sending. Run 'Process AI Actions' to send.");
      onRefresh?.();
    } catch (e) {
      console.error("Failed to queue quote:", e);
      toast.error("Failed to queue quote for sending");
    } finally {
      setSendingQuote(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "instagram":
        return <Instagram className="h-3 w-3 text-pink-400" />;
      case "email":
        return <Mail className="h-3 w-3 text-blue-400" />;
      default:
        return <MessageSquare className="h-3 w-3 text-purple-400" />;
    }
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Quote #{quote.quote_number}</span>
            <div className="flex gap-2">
              {quote.source_conversation_id && (
                <Button variant="outline" size="sm" onClick={openInMightyChat}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in MightyChat
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={sendQuote}
                disabled={sendingQuote}
                className="bg-green-600 hover:bg-green-700"
              >
                {sendingQuote ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Send Quote
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left: Quote Details */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Customer</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="font-semibold">{quote.customer_name}</p>
                <p className="text-sm text-muted-foreground">{quote.customer_email}</p>
                {quote.customer_phone && (
                  <p className="text-sm text-muted-foreground">{quote.customer_phone}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-4 w-4" />
                <span className="text-sm font-medium">Vehicle</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="font-semibold">
                  {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}
                </p>
                {quote.product_name && (
                  <p className="text-sm text-muted-foreground">{quote.product_name}</p>
                )}
                {quote.sqft && (
                  <p className="text-sm text-muted-foreground">{quote.sqft} sq ft</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Pricing</span>
              </div>
              <div className="pl-6">
                <p className="text-2xl font-bold text-green-500">
                  ${quote.total_price.toFixed(2)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Badge variant={quote.status === "completed" ? "default" : "secondary"}>
                {quote.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Right: Conversation Thread */}
          <div className="flex flex-col border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 border-b">
              <h4 className="text-sm font-medium">Conversation History</h4>
            </div>

            {!quote.source_conversation_id ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No linked conversation
              </div>
            ) : loadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No messages found
              </div>
            ) : (
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          msg.direction === "outbound"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {getChannelIcon(msg.channel)}
                          <span className="text-[10px] opacity-70">
                            {msg.direction === "outbound" ? "Sent" : "Received"}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] opacity-50 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
