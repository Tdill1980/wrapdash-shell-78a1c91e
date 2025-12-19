import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, XCircle, AlertCircle, Clock, 
  FileText, MessageSquare, DollarSign, RefreshCw,
  ArrowRight, Sparkles, Send, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ActionPayload {
  agent?: string;
  type?: string;
  subject_line?: string;
  email_body?: string;
  quote_total?: number;
  customer_name?: string;
  customer_email?: string;
  content_type?: string;
  summary?: string;
  source?: string;
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
  pending_email?: boolean;
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

const ACTION_TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  quote_generated: { icon: DollarSign, label: "Quote", color: "text-green-400" },
  create_quote: { icon: DollarSign, label: "Quote Request", color: "text-green-400" },
  auto_quote_generated: { icon: DollarSign, label: "AI Quote", color: "text-green-400" },
  content_draft: { icon: FileText, label: "Content", color: "text-blue-400" },
  escalation: { icon: AlertCircle, label: "Escalation", color: "text-yellow-400" },
  file_review: { icon: FileText, label: "File Review", color: "text-purple-400" },
  default: { icon: MessageSquare, label: "Action", color: "text-muted-foreground" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function AIApprovalsCard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [actions, setActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingActions();
  }, []);

  const fetchPendingActions = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_actions")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setActions((data || []) as unknown as AIAction[]);
    } catch (err) {
      console.error("Error fetching AI actions:", err);
    } finally {
      setLoading(false);
    }
  };

  const isQuoteAction = (actionType: string) => {
    return ['create_quote', 'auto_quote_generated', 'quote_generated'].includes(actionType);
  };

  const handleApproveAndSend = async (action: AIAction) => {
    setProcessingId(action.id);
    try {
      const payload = action.action_payload;
      
      // For quote actions, call send-approved-quote to send email
      if (isQuoteAction(action.action_type)) {
        const quoteId = payload?.auto_quote?.quote_id;
        const customerEmail = payload?.auto_quote?.customer_email || payload?.customer_email;
        const customerName = payload?.auto_quote?.customer_name || payload?.customer_name;
        
        const { data, error } = await supabase.functions.invoke('send-approved-quote', {
          body: {
            actionId: action.id,
            quoteId,
            customerEmail,
            customerName
          }
        });

        if (error) throw error;

        setActions((prev) => prev.filter((a) => a.id !== action.id));
        toast({
          title: data?.emailSent ? "Quote Sent!" : "Approved",
          description: data?.emailSent 
            ? `Quote emailed to ${customerEmail}`
            : "Quote approved (no email address available)",
        });
      } else {
        // For non-quote actions, just mark as resolved
        await handleApprove(action.id);
      }
    } catch (err) {
      console.error("Error approving action:", err);
      toast({
        title: "Error",
        description: "Failed to approve and send quote.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("ai_actions")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setActions((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: "Approved",
        description: "Action has been approved and marked as resolved.",
      });
    } catch (err) {
      console.error("Error approving action:", err);
      toast({
        title: "Error",
        description: "Failed to approve action.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("ai_actions")
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: 'rejected'
        })
        .eq("id", id);

      if (error) throw error;

      setActions((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: "Rejected",
        description: "Quote has been rejected and will not be sent.",
      });
    } catch (err) {
      console.error("Error rejecting action:", err);
      toast({
        title: "Error",
        description: "Failed to reject action.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getActionConfig = (actionType: string) => {
    return ACTION_TYPE_CONFIG[actionType] || ACTION_TYPE_CONFIG.default;
  };

  const getActionDescription = (action: AIAction): string => {
    const payload = action.action_payload;
    if (!payload) return action.action_type;

    // Quote actions - show vehicle and price
    if (isQuoteAction(action.action_type)) {
      const autoQuote = payload.auto_quote;
      if (autoQuote?.total_price) {
        const vehicle = payload.vehicle;
        const vehicleStr = vehicle?.year && vehicle?.make && vehicle?.model 
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : 'Vehicle';
        return `${vehicleStr} - $${autoQuote.total_price.toLocaleString()}`;
      }
      if (payload.vehicle?.make) {
        return `Quote for ${payload.vehicle.year || ''} ${payload.vehicle.make} ${payload.vehicle.model || ''}`.trim();
      }
    }

    if (payload.subject_line) return payload.subject_line;
    if (payload.customer_name && payload.quote_total) {
      return `Quote for ${payload.customer_name} - $${payload.quote_total}`;
    }
    if (payload.summary) return payload.summary;
    if (payload.agent) return `From ${payload.agent}`;
    
    return action.action_type.replace(/_/g, " ");
  };

  const getQuoteDetails = (action: AIAction) => {
    const payload = action.action_payload;
    if (!payload || !isQuoteAction(action.action_type)) return null;

    const autoQuote = payload.auto_quote;
    return {
      email: autoQuote?.customer_email || payload.customer_email,
      name: autoQuote?.customer_name || payload.customer_name || payload.sender_username,
      quoteNumber: autoQuote?.quote_number,
      price: autoQuote?.total_price,
      source: payload.source,
      hasEmail: !!(autoQuote?.customer_email || payload.customer_email) && 
                !(autoQuote?.customer_email || payload.customer_email || '').includes('@capture.local')
    };
  };

  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardHeader className="pb-3">
          <CardTitle className="dashboard-card-title flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="dashboard-card-title flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Approvals
            {actions.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                {actions.length} pending
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/mightytask")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View Ops Desk
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No pending AI actions require your approval.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => {
              const config = getActionConfig(action.action_type);
              const IconComponent = config.icon;
              const isProcessing = processingId === action.id;
              const isQuote = isQuoteAction(action.action_type);
              const quoteDetails = getQuoteDetails(action);

              return (
                <div
                  key={action.id}
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-lg",
                    "bg-secondary/50 border border-border",
                    "transition-all duration-200 hover:bg-secondary",
                    isProcessing && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg bg-background", config.color)}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">
                          {config.label}
                        </span>
                        {action.priority && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] px-1.5 py-0", PRIORITY_COLORS[action.priority] || PRIORITY_COLORS.low)}
                          >
                            {action.priority}
                          </Badge>
                        )}
                        {quoteDetails?.source && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {quoteDetails.source}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(action.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {getActionDescription(action)}
                      </p>
                      
                      {/* Quote details row */}
                      {isQuote && quoteDetails && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {quoteDetails.email && (
                            <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                              📧 {quoteDetails.hasEmail ? quoteDetails.email : 'No email'}
                            </span>
                          )}
                          {quoteDetails.quoteNumber && (
                            <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                              #{quoteDetails.quoteNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isQuote ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApproveAndSend(action)}
                            disabled={isProcessing}
                            className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            {quoteDetails?.hasEmail ? 'Send' : 'Approve'}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReject(action.id)}
                            disabled={isProcessing}
                            className="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleApprove(action.id)}
                            disabled={isProcessing}
                            className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReject(action.id)}
                            disabled={isProcessing}
                            className="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
