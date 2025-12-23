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
  MessageSquare, FileText, Clock, Loader2, Image, X, Maximize2, Paperclip,
  Instagram, AtSign, Globe
} from "lucide-react";
import { Json } from "@/integrations/supabase/types";
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
  metadata?: {
    attachments?: string[];
    [key: string]: unknown;
  } | null;
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
    vehicle_year?: string | number;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_type?: string;
    wrap_type?: string;
    base_price?: number;
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
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    if (open && action) {
      fetchConversation();
      fetchQuoteData();
    }
  }, [open, action]);

  const fetchConversation = async () => {
    setLoadingMessages(true);
    
    try {
      // First try direct conversation_id from action payload
      const conversationId = action?.action_payload?.conversation_id;
      
      if (conversationId) {
        const { data, error } = await supabase
          .from("messages")
          .select("id, content, direction, sender_name, created_at, metadata")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          setMessages(data.map(m => ({
            ...m,
            metadata: m.metadata as Message["metadata"]
          })));
          setLoadingMessages(false);
          return;
        }
      }

      // FALLBACK: Try to find conversation by customer email
      const customerEmail = action?.action_payload?.customer_email || 
                           action?.action_payload?.auto_quote?.customer_email;
      
      if (customerEmail) {
        // Find contact by email
        const { data: contact } = await supabase
          .from("contacts")
          .select("id")
          .eq("email", customerEmail.toLowerCase())
          .maybeSingle();
        
        if (contact) {
          // Find most recent conversation for this contact
          const { data: convo } = await supabase
            .from("conversations")
            .select("id")
            .eq("contact_id", contact.id)
            .order("last_message_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (convo) {
            // Fetch messages from this conversation
            const { data } = await supabase
              .from("messages")
              .select("id, content, direction, sender_name, created_at, metadata")
              .eq("conversation_id", convo.id)
              .order("created_at", { ascending: true });
            
            if (data && data.length > 0) {
              setMessages(data.map(m => ({
                ...m,
                metadata: m.metadata as Message["metadata"]
              })));
              setLoadingMessages(false);
              return;
            }
          }
        }
      }

      // No messages found
      setMessages([]);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchQuoteData = async () => {
    if (!action?.action_payload) return;

    const payload = action.action_payload;
    
    // Try to get quote data from the action payload directly
    if (payload.auto_quote?.quote_id) {
      try {
        const { data } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", payload.auto_quote.quote_id)
          .maybeSingle();
        
        if (data) {
          setQuoteData(data);
          return;
        }
      } catch (err) {
        console.error("Error fetching quote:", err);
      }
    }

    // Use data from the action payload
    setQuoteData({
      vehicle_year: payload.vehicle?.year || payload.auto_quote?.vehicle_year,
      vehicle_make: payload.vehicle?.make || payload.auto_quote?.vehicle_make,
      vehicle_model: payload.vehicle?.model || payload.auto_quote?.vehicle_model,
      product_name: payload.auto_quote?.product_name,
      quote_total: payload.auto_quote?.total_price || payload.quote_total || 0,
      customer_name: payload.auto_quote?.customer_name || payload.customer_name,
      customer_email: payload.auto_quote?.customer_email || payload.customer_email,
    });
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
    offersInstallation: false, // WPW does NOT do installs
  });

  const subjectLine = getSubjectLine(selectedTone, quoteData || {
    vehicle_make: payload?.vehicle?.make,
    vehicle_model: payload?.vehicle?.model,
    quote_total: payload?.auto_quote?.total_price || 0,
  });

  // Check if message content is HTML garbage (email templates, notifications)
  const isHtmlGarbage = (content: string): boolean => {
    if (!content) return false;
    const lowerContent = content.toLowerCase();
    return lowerContent.includes('<!doctype') || 
           lowerContent.includes('<html') || 
           lowerContent.includes('<head') ||
           lowerContent.includes('<meta charset') ||
           lowerContent.includes('font-family:') ||
           lowerContent.includes('background-color:');
  };

  // Strip HTML tags and clean up email content for display
  const cleanMessageContent = (content: string): string => {
    if (!content) return "";
    
    // Remove HTML tags
    let cleaned = content.replace(/<[^>]*>/g, " ");
    
    // Remove CSS/style blocks
    cleaned = cleaned.replace(/\{[^}]*\}/g, " ");
    
    // Remove common email artifacts
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
    cleaned = cleaned.replace(/&nbsp;/g, " ");
    cleaned = cleaned.replace(/&lt;/g, "<");
    cleaned = cleaned.replace(/&gt;/g, ">");
    cleaned = cleaned.replace(/&amp;/g, "&");
    cleaned = cleaned.replace(/&quot;/g, '"');
    
    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    
    // Limit length for readability
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 500) + "...";
    }
    
    return cleaned || "(No message content)";
  };

  // Filter out HTML garbage messages
  const cleanMessages = messages.filter(msg => !isHtmlGarbage(msg.content));

  // Extract original request info from action payload
  const originalMessage = payload?.original_message as string | undefined;
  
  // Extract vehicle info - handle both payload.vehicle and payload.auto_quote formats
  const vehicleYear = payload?.vehicle?.year || payload?.auto_quote?.vehicle_year;
  const vehicleMake = payload?.vehicle?.make || payload?.auto_quote?.vehicle_make;
  const vehicleModel = payload?.vehicle?.model || payload?.auto_quote?.vehicle_model;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + 
           " at " + 
           date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
              ) : (
                <div className="space-y-4">
                  {/* Original Request Card - Always show at top */}
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Original Request</span>
                      </div>
                      
                      {/* Source Badge */}
                      {(payload?.source as string) && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {(payload?.source as string) === 'instagram' ? (
                            <Instagram className="w-3 h-3" />
                          ) : (payload?.source as string) === 'email' ? (
                            <Mail className="w-3 h-3" />
                          ) : (
                            <Globe className="w-3 h-3" />
                          )}
                          {(payload?.source as string).charAt(0).toUpperCase() + (payload?.source as string).slice(1)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Customer/Sender Info */}
                    {(payload?.sender_username as string) && (
                      <div className="flex items-center gap-2 text-sm mb-2 text-muted-foreground">
                        <AtSign className="w-3 h-3" />
                        <span>{payload.sender_username as string}</span>
                      </div>
                    )}
                    
                    {/* AI Agent Info */}
                    {(payload?.agent as string) && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Bot className="w-3 h-3 text-cyan-500" />
                        <span className="text-cyan-500 font-medium">{payload.agent as string}</span>
                      </div>
                    )}
                    
                    {/* Vehicle Info */}
                    {vehicleMake && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {vehicleYear} {vehicleMake} {vehicleModel}
                        </span>
                      </div>
                    )}
                    
                    {/* Product Type */}
                    {payload?.auto_quote?.product_name && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Product: {payload.auto_quote.product_name}
                      </div>
                    )}
                    
                    {/* Original Customer Message */}
                    {originalMessage ? (
                      <div className="mt-3">
                        <span className="text-xs text-muted-foreground mb-1 block">Customer said:</span>
                        <p className="text-sm leading-relaxed bg-secondary rounded-lg p-3">
                          "{originalMessage}"
                        </p>
                      </div>
                    ) : null}
                    
                    {/* AI Draft Message */}
                    {(payload?.draft_message as string) && (
                      <div className="mt-3">
                        <span className="text-xs text-muted-foreground mb-1 block">AI response draft:</span>
                        <p className="text-sm leading-relaxed bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                          {payload.draft_message as string}
                        </p>
                      </div>
                    )}
                    
                    {/* Quote Total */}
                    {(payload?.auto_quote?.total_price || payload?.quote_total) && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-primary/20">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-semibold">
                          ${Number(payload.auto_quote?.total_price || payload.quote_total).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Conversation Messages - filtered */}
                  {cleanMessages.length > 0 ? (
                    cleanMessages.map((msg) => {
                      const isOutbound = msg.direction === "outbound";
                      const cleanedContent = cleanMessageContent(msg.content);
                      const attachments = msg.metadata?.attachments || [];
                      
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col gap-1",
                            isOutbound ? "items-end" : "items-start"
                          )}
                        >
                          <span className="text-xs text-muted-foreground px-1">
                            {msg.sender_name || (isOutbound ? "WePrintWraps" : "Customer")}
                          </span>
                          
                          <div className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5",
                            isOutbound 
                              ? "bg-primary text-primary-foreground rounded-br-md" 
                              : "bg-secondary text-secondary-foreground rounded-bl-md"
                          )}>
                            <p className="text-sm leading-relaxed">{cleanedContent}</p>
                            
                            {attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {attachments.map((url, idx) => {
                                  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)/i) || 
                                                 url.includes("ig_messaging_cdn") ||
                                                 url.includes("fbcdn");
                                  
                                  return isImage ? (
                                    <button
                                      key={idx}
                                      onClick={() => setExpandedImage(url)}
                                      className="relative group rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors"
                                    >
                                      <img 
                                        src={url} 
                                        alt={`Attachment ${idx + 1}`}
                                        className="w-16 h-16 object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </button>
                                  ) : (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors text-xs"
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      File {idx + 1}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          <span className="text-[10px] text-muted-foreground px-1">
                            {formatDateTime(msg.created_at)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No additional conversation messages
                    </div>
                  )}
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

      {/* Expanded Image Lightbox */}
      {expandedImage && (
        <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center justify-center min-h-[60vh] p-4">
              <img
                src={expandedImage}
                alt="Expanded attachment"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
