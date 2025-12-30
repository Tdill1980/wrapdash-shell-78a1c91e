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
import { supabase } from "@/integrations/supabase/client";
import {
  Send, XCircle, User, Bot, Mail, Car, DollarSign, 
  MessageSquare, FileText, Clock, Loader2, Image, X, Maximize2, 
  Instagram, AtSign, Globe, ExternalLink, Video, CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface AIApprovalGenericModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: AIAction | null;
  onApprove: (action: AIAction) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
  isProcessing: boolean;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  file_review: "File Review",
  create_quote: "Quote Request",
  auto_quote_generated: "AI Quote",
  quote_generated: "Quote",
  approve_message: "Message Approval",
  content_draft: "Content Draft",
  escalation: "Escalation",
  create_task: "Task Creation",
  sales_recovery_content: "Sales Recovery",
  content_request: "Content Request",
};

export function AIApprovalGenericModal({
  open,
  onOpenChange,
  action,
  onApprove,
  onReject,
  isProcessing,
}: AIApprovalGenericModalProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);
  const [foundConversationId, setFoundConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (open && action) {
      findAndFetchConversation();
    } else {
      setMessages([]);
      setFoundConversationId(null);
    }
  }, [open, action]);

  const findAndFetchConversation = async () => {
    if (!action) return;
    
    setLoadingMessages(true);
    const payload = action.action_payload || {};
    
    // Try multiple ways to find conversation_id
    let conversationId = payload.conversation_id as string | undefined;
    
    // Fallback 1: Look up via sender_id in messages metadata
    if (!conversationId && payload.sender_id) {
      console.log("🔍 Looking up conversation via sender_id:", payload.sender_id);
      const { data: msgWithSender } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("metadata->>sender_id", payload.sender_id as string)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (msgWithSender?.conversation_id) {
        conversationId = msgWithSender.conversation_id;
        console.log("✅ Found conversation via sender_id:", conversationId);
      }
    }
    
    // Fallback 2: Look up via sender_username pattern
    if (!conversationId && payload.sender_username) {
      const { data: convBySubject } = await supabase
        .from("conversations")
        .select("id")
        .ilike("subject", `%${payload.sender_username}%`)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (convBySubject?.id) {
        conversationId = convBySubject.id;
        console.log("✅ Found conversation via subject pattern:", conversationId);
      }
    }
    
    if (conversationId) {
      setFoundConversationId(conversationId);
      await fetchConversation(conversationId);
    } else {
      console.log("❌ No conversation found for action:", action.id);
      setFoundConversationId(null);
      setLoadingMessages(false);
    }
  };

  const fetchConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, direction, sender_name, created_at, metadata")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data.map(m => ({
          ...m,
          metadata: m.metadata as Message["metadata"]
        })));
      }
    } catch (err) {
      console.error("Error fetching conversation:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  if (!action) return null;

  const payload = action.action_payload || {};
  const actionLabel = ACTION_TYPE_LABELS[action.action_type] || action.action_type.replace(/_/g, " ");
  
  // Extract common fields from payload
  const source = payload.source as string | undefined;
  const senderUsername = payload.sender_username as string | undefined;
  const originalMessage = (payload.message as string) || (payload.original_message as string) || null;
  const draftMessage = payload.draft_message as string | undefined;
  const fileUrls = (payload.file_urls as string[]) || [];
  const conversationId = payload.conversation_id as string | undefined;
  const agent = payload.agent as string | undefined;
  
  // Quote-related fields
  const autoQuote = payload.auto_quote as Record<string, unknown> | undefined;
  const vehicle = payload.vehicle as { year?: string; make?: string; model?: string } | undefined;
  const quoteTotal = autoQuote?.total_price || payload.quote_total;
  const quoteNumber = autoQuote?.quote_number || payload.quote_number;
  const customerName = autoQuote?.customer_name || payload.customer_name || senderUsername;
  const customerEmail = autoQuote?.customer_email || payload.customer_email;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + 
           " at " + 
           date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isImage = (url: string) => url.match(/\.(jpg|jpeg|png|gif|webp)/i);
  const isVideo = (url: string) => url.match(/\.(mp4|mov|webm)/i);

  const handleViewFullThread = () => {
    // Use the found conversation ID from our lookup, fallback to payload
    const threadId = foundConversationId || conversationId;
    if (!threadId) {
      toast.error("No conversation linked to this action");
      return;
    }
    navigate(`/mightychat?id=${threadId}`);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-border">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span>{actionLabel}</span>
                {action.priority && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      action.priority === "high" && "bg-destructive/20 text-destructive border-destructive/30"
                    )}
                  >
                    {action.priority}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                {source && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {source === "instagram" ? (
                      <Instagram className="w-3 h-3" />
                    ) : source === "email" ? (
                      <Mail className="w-3 h-3" />
                    ) : (
                      <Globe className="w-3 h-3" />
                    )}
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </Badge>
                )}
                {action.created_at && (
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(action.created_at)}
                  </span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
            <div className="p-4 space-y-4">
              {/* Sender / Customer Info */}
              {(senderUsername || customerName) && (
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{String(customerName || senderUsername)}</p>
                    {customerEmail && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {String(customerEmail)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Agent Info */}
              {agent && (
                <div className="flex items-center gap-2 text-sm p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <Bot className="w-4 h-4 text-cyan-500" />
                  <span className="text-cyan-500 font-medium">Created by: {agent}</span>
                </div>
              )}

              {/* Vehicle Info for Quotes */}
              {vehicle?.make && (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                  <Car className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </span>
                </div>
              )}

              {(quoteTotal || quoteNumber) && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quote {quoteNumber && `#${String(quoteNumber)}`}</span>
                    {quoteTotal && (
                      <span className="text-lg font-bold text-green-500 flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {Number(quoteTotal).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Original Message */}
              {originalMessage && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Original Message</span>
                  </div>
                  <p className="text-sm leading-relaxed">{originalMessage}</p>
                </div>
              )}

              {/* AI Draft Response */}
              {draftMessage && (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-medium text-cyan-500">AI Draft Response</span>
                  </div>
                  <p className="text-sm leading-relaxed">{draftMessage}</p>
                </div>
              )}

              {/* File Attachments */}
              {fileUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Image className="w-4 h-4" />
                    Attachments ({fileUrls.length})
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fileUrls.map((url, idx) => (
                      <div 
                        key={idx} 
                        className="relative group cursor-pointer"
                        onClick={() => setExpandedMedia(url)}
                      >
                        {isImage(url) ? (
                          <img 
                            src={url} 
                            alt={`Attachment ${idx + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-border hover:border-primary/50 transition-colors"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        ) : isVideo(url) ? (
                          <div className="relative">
                            <video 
                              src={url} 
                              className="w-full h-40 object-cover rounded-lg border border-border"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                              <Video className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-40 flex flex-col items-center justify-center gap-2 bg-muted rounded-lg border border-border">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">File</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation History - show if we have messages OR found a conversation */}
              {(foundConversationId || conversationId || messages.length > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Conversation History
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewFullThread}
                      className="h-7 text-xs gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Full Thread
                    </Button>
                  </div>
                  
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-3 p-3 bg-secondary/20 rounded-lg max-h-60 overflow-y-auto">
                      {messages.slice(-10).map((msg) => {
                        const isOutbound = msg.direction === "outbound";
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col gap-1",
                              isOutbound ? "items-end" : "items-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                              isOutbound 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary"
                            )}>
                              {msg.content.substring(0, 300)}{msg.content.length > 300 ? '...' : ''}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {msg.sender_name || (isOutbound ? "You" : "Customer")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages in conversation
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
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
              onClick={() => onApprove(action)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Media Modal */}
      {expandedMedia && (
        <Dialog open={!!expandedMedia} onOpenChange={() => setExpandedMedia(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle className="flex items-center justify-between">
                <span>Media Preview</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedMedia(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center bg-black/50">
              {isImage(expandedMedia) ? (
                <img 
                  src={expandedMedia} 
                  alt="Expanded media"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : isVideo(expandedMedia) ? (
                <video 
                  src={expandedMedia} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-[70vh]"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <a 
                    href={expandedMedia} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open File
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
