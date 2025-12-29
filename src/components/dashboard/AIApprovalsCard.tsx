import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, XCircle, AlertCircle, Clock, 
  FileText, MessageSquare, DollarSign, RefreshCw,
  ArrowRight, Sparkles, Send, Eye, Filter, ListTodo
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AIApprovalDetailModal } from "./AIApprovalDetailModal";

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
  resolved_at?: string | null;
  resolved_by?: string | null;
}

type FilterType = 'all' | 'quotes' | 'file_review' | 'messages' | 'escalations' | 'other';

const FILTER_CONFIG: Record<FilterType, { label: string; actionTypes: string[] | null }> = {
  all: { label: 'All', actionTypes: null },
  quotes: { label: 'Quotes', actionTypes: ['auto_quote_generated', 'create_quote', 'quote_generated'] },
  file_review: { label: 'File Reviews', actionTypes: ['file_review'] },
  messages: { label: 'Messages', actionTypes: ['approve_message'] },
  escalations: { label: 'Escalations', actionTypes: ['escalation'] },
  other: { label: 'Other', actionTypes: ['create_task', 'sales_recovery_content', 'content_request', 'content_draft'] },
};

const ACTION_TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  quote_generated: { icon: DollarSign, label: "Quote", color: "text-green-400" },
  create_quote: { icon: DollarSign, label: "Quote Request", color: "text-green-400" },
  auto_quote_generated: { icon: DollarSign, label: "AI Quote", color: "text-green-400" },
  content_draft: { icon: FileText, label: "Content", color: "text-blue-400" },
  escalation: { icon: AlertCircle, label: "Escalation", color: "text-yellow-400" },
  file_review: { icon: FileText, label: "File Review", color: "text-purple-400" },
  approve_message: { icon: MessageSquare, label: "Message", color: "text-blue-400" },
  create_task: { icon: ListTodo, label: "Task", color: "text-cyan-400" },
  sales_recovery_content: { icon: DollarSign, label: "Sales Recovery", color: "text-orange-400" },
  content_request: { icon: FileText, label: "Content Request", color: "text-indigo-400" },
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
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCounts, setFilterCounts] = useState<Record<FilterType, number>>({
    all: 0, quotes: 0, file_review: 0, messages: 0, escalations: 0, other: 0
  });
  const [showHistory, setShowHistory] = useState(false);

  const fetchPendingActions = useCallback(async () => {
    try {
      let query = supabase
        .from("ai_actions")
        .select("*")
        .eq("resolved", showHistory)
        .order("created_at", { ascending: false })
        .limit(25);

      // Apply filter if not "all"
      const filterConfig = FILTER_CONFIG[filterType];
      if (filterConfig.actionTypes) {
        query = query.in('action_type', filterConfig.actionTypes);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActions((data || []) as unknown as AIAction[]);
    } catch (err) {
      console.error("Error fetching AI actions:", err);
    } finally {
      setLoading(false);
    }
  }, [filterType, showHistory]);

  const fetchFilterCounts = useCallback(async () => {
    try {
      // Fetch counts for each filter type
      const countPromises = Object.entries(FILTER_CONFIG).map(async ([key, config]) => {
        let query = supabase
          .from("ai_actions")
          .select("id", { count: 'exact', head: true })
          .eq("resolved", showHistory);
        
        if (config.actionTypes) {
          query = query.in('action_type', config.actionTypes);
        }
        
        const { count } = await query;
        return [key, count || 0] as [FilterType, number];
      });
      
      const results = await Promise.all(countPromises);
      setFilterCounts(Object.fromEntries(results) as Record<FilterType, number>);
    } catch (err) {
      console.error("Error fetching filter counts:", err);
    }
  }, [showHistory]);

  useEffect(() => {
    fetchPendingActions();
    fetchFilterCounts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('ai-actions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_actions'
        },
        () => {
          fetchPendingActions();
          fetchFilterCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingActions, fetchFilterCounts]);

  const isQuoteAction = (actionType: string) => {
    return ['create_quote', 'auto_quote_generated', 'quote_generated'].includes(actionType);
  };

  const handleApproveAndSend = async (action: AIAction, tone?: string, design?: string) => {
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
            customerName,
            tone: tone || 'installer',
            design: design || 'performance',
          }
        });

        if (error) throw error;

        setActions((prev) => prev.filter((a) => a.id !== action.id));
        setDetailModalOpen(false);
        setSelectedAction(null);
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

  const handleOpenDetail = (action: AIAction) => {
    setSelectedAction(action);
    setDetailModalOpen(true);
  };

  const handleRejectFromModal = async (actionId: string) => {
    await handleReject(actionId);
    setDetailModalOpen(false);
    setSelectedAction(null);
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="dashboard-card-title flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Approvals
            {filterCounts.all > 0 && !showHistory && (
              <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                {filterCounts.all}
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
        
        {/* Pending / History toggle */}
        <div className="flex gap-1 mt-2">
          <Button
            variant={!showHistory ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowHistory(false)}
            className="h-7 text-xs"
          >
            Pending ({filterCounts.all})
          </Button>
          <Button
            variant={showHistory ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowHistory(true)}
            className="h-7 text-xs"
          >
            History
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Filter bar */}
        <div className="flex gap-1 flex-wrap mb-3">
          {(Object.keys(FILTER_CONFIG) as FilterType[]).map((key) => {
            const config = FILTER_CONFIG[key];
            const count = filterCounts[key];
            const isActive = filterType === key;
            
            return (
              <Button
                key={key}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType(key)}
                className={cn(
                  "h-6 text-[10px] px-2",
                  isActive && "bg-primary/20 text-primary"
                )}
              >
                <Filter className="w-3 h-3 mr-1" />
                {config.label}
                {count > 0 && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </Button>
            );
          })}
        </div>

        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-sm font-medium text-foreground">
              {showHistory ? "No history yet" : "All caught up!"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {showHistory 
                ? "Approved/rejected actions will appear here."
                : "No pending AI actions require your approval."}
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
                  onClick={() => isQuote && handleOpenDetail(action)}
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-lg",
                    "bg-secondary/50 border border-border",
                    "transition-all duration-200 hover:bg-secondary",
                    isProcessing && "opacity-50 pointer-events-none",
                    isQuote && "cursor-pointer"
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

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {isQuote ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDetail(action)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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

      <AIApprovalDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        action={selectedAction}
        onApprove={handleApproveAndSend}
        onReject={handleRejectFromModal}
        isProcessing={processingId !== null}
      />
    </Card>
  );
}
