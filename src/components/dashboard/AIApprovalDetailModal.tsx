import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, XCircle, User, Bot, Mail, Car, DollarSign, 
  MessageSquare, FileText, Clock, Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  generateEmailPreview, 
  getSubjectLine, 
  EMAIL_TONES, 
  EMAIL_DESIGNS 
} from "@/utils/emailPreview";

interface Message {
  id: string;
  content: string;
  direction: string;
  sender_name: string | null;
  created_at: string;
}

interface ActionPayload {
  agent?: string;
  type?: string;
  subject_line?: string;
  email_body?: string;
  quote_total?: number;
  customer_name?: string;
  customer_email?: string;
  conversation_id?: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
  auto_quote?: {
    quote_id?: string;
    quote_number?: string;
    total_price?: number;
    product_name?: string;
    customer_name?: string;
    customer_email?: string;
  };
  [key: string]: unknown;
}

interface AIAction {
  id: string;
  action_type: string;
  action_payload: ActionPayload | null;
  priority: string | null;
  created_at: string | null;
  resolved: boolean | null;
}

interface AIApprovalDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: AIAction | null;
  onApprove: (action: AIAction, tone?: string, design?: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
  isProcessing: boolean;
}

export function AIApprovalDetailModal({
  open,
  onOpenChange,
  action,
  onApprove,
  onReject,
  isProcessing,
}: AIApprovalDetailModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedTone, setSelectedTone] = useState("installer");
  const [selectedDesign, setSelectedDesign] = useState("performance");
  const [quoteData, setQuoteData] = useState<any>(null);

  useEffect(() => {
    if (open && action) {
      fetchConversation();
      fetchQuoteData();
    }
  }, [open, action]);

  const fetchConversation = async () => {
    if (!action?.action_payload) return;
    
    const conversationId = action.action_payload.conversation_id;
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, direction, sender_name, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchQuoteData = async () => {
    if (!action?.action_payload?.auto_quote?.quote_id) {
      // Use data from action payload
      const payload = action?.action_payload;
      if (payload) {
        setQuoteData({
          vehicle_year: payload.vehicle?.year,
          vehicle_make: payload.vehicle?.make,
          vehicle_model: payload.vehicle?.model,
          product_name: payload.auto_quote?.product_name,
          quote_total: payload.auto_quote?.total_price || payload.quote_total || 0,
        });
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", action.action_payload.auto_quote.quote_id)
        .single();

      if (error) throw error;
      setQuoteData(data);
    } catch (err) {
      console.error("Error fetching quote:", err);
      // Fall back to action payload data
      const payload = action?.action_payload;
      if (payload) {
        setQuoteData({
          vehicle_year: payload.vehicle?.year,
          vehicle_make: payload.vehicle?.make,
          vehicle_model: payload.vehicle?.model,
          product_name: payload.auto_quote?.product_name,
          quote_total: payload.auto_quote?.total_price || payload.quote_total || 0,
        });
      }
    }
  };

  if (!action) return null;

  const payload = action.action_payload;
  const customerName = payload?.auto_quote?.customer_name || payload?.customer_name || "Customer";
  const customerEmail = payload?.auto_quote?.customer_email || payload?.customer_email;
  const hasValidEmail = customerEmail && !customerEmail.includes("@capture.local");

  const emailPreviewHtml = generateEmailPreview({
    customerName,
    quoteData: quoteData || {
      vehicle_year: payload?.vehicle?.year,
      vehicle_make: payload?.vehicle?.make,
      vehicle_model: payload?.vehicle?.model,
      product_name: payload?.auto_quote?.product_name,
      quote_total: payload?.auto_quote?.total_price || payload?.quote_total || 0,
    },
    tone: selectedTone,
    design: selectedDesign,
  });

  const subjectLine = getSubjectLine(selectedTone, quoteData || {
    vehicle_make: payload?.vehicle?.make,
    vehicle_model: payload?.vehicle?.model,
    quote_total: payload?.auto_quote?.total_price || 0,
  });

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span>AI Quote Review</span>
              {payload?.auto_quote?.quote_number && (
                <Badge variant="outline" className="text-xs">
                  #{payload.auto_quote.quote_number}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{customerName}</span>
              {hasValidEmail && (
                <>
                  <span className="mx-1">•</span>
                  <Mail className="w-4 h-4" />
                  <span>{customerEmail}</span>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Conversation History */}
          <div className="w-1/2 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border bg-secondary/30">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation History
              </h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No conversation history available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This quote may have been generated automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isBot = msg.direction === "outbound";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2",
                          isBot ? "flex-row" : "flex-row-reverse"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                          isBot ? "bg-primary/20" : "bg-secondary"
                        )}>
                          {isBot ? (
                            <Bot className="w-4 h-4 text-primary" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          isBot 
                            ? "bg-secondary/50 text-foreground" 
                            : "bg-primary/20 text-foreground"
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {msg.sender_name && <span className="mr-2">{msg.sender_name}</span>}
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Email Preview */}
          <div className="w-1/2 flex flex-col">
            <div className="p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Preview
                </h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedTone} onValueChange={setSelectedTone}>
                    <SelectTrigger className="h-7 text-xs w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDesign} onValueChange={setSelectedDesign}>
                    <SelectTrigger className="h-7 text-xs w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_DESIGNS.map((design) => (
                        <SelectItem key={design.value} value={design.value}>
                          {design.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Subject Line */}
            <div className="p-3 border-b border-border bg-background">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium">{subjectLine}</span>
              </div>
              {hasValidEmail && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-muted-foreground">To:</span>
                  <span>{customerEmail}</span>
                </div>
              )}
            </div>

            {/* Email HTML Preview */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                <iframe
                  srcDoc={emailPreviewHtml}
                  className="w-full h-[500px] rounded-lg border border-border"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Created {action.created_at 
                ? new Date(action.created_at).toLocaleString() 
                : "Unknown"}
            </span>
            {payload?.vehicle && (
              <>
                <span className="mx-2">•</span>
                <Car className="w-4 h-4" />
                <span>
                  {payload.vehicle.year} {payload.vehicle.make} {payload.vehicle.model}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onReject(action.id)}
              disabled={isProcessing}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => onApprove(action, selectedTone, selectedDesign)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {hasValidEmail ? "Approve & Send" : "Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
