import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  Mail, 
  MessageCircle, 
  Globe, 
  Clock, 
  User, 
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface BacklogItem {
  id: string;
  action_type: string;
  action_payload: {
    assigned_to?: string;
    conversation_id?: string;
    contact_id?: string;
    channel?: string;
    customer_name?: string;
    customer_email?: string;
    source_message_id?: string;
    source_message_excerpt?: string;
    notes?: string;
    task_type?: string;
    escalation_reason?: string;
  };
  created_at: string;
  status: string;
  priority: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
}

export default function Backlog() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBacklog();
  }, []);

  const fetchBacklog = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_actions")
      .select("*")
      .in("action_type", ["create_task", "escalation", "cx_risk_flag"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data as BacklogItem[]);
    }
    setLoading(false);
  };

  const markResolved = async (itemId: string, resolvedBy: string) => {
    setResolvingId(itemId);
    try {
      const { error } = await supabase
        .from("ai_actions")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          status: "resolved",
        })
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Marked as resolved!");
      fetchBacklog();
    } catch (err) {
      console.error("Mark resolved error:", err);
      toast.error("Failed to mark as resolved");
    } finally {
      setResolvingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "escalations") return item.action_type === "escalation" || item.action_type === "cx_risk_flag";
    if (filter === "unassigned") return !item.action_payload?.assigned_to;
    return item.action_payload?.assigned_to?.toLowerCase() === filter.toLowerCase();
  });

  const pendingItems = filteredItems.filter((i) => !i.resolved);
  const resolvedItems = filteredItems.filter((i) => i.resolved);

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case "email": return <Mail className="w-4 h-4 text-emerald-500" />;
      case "instagram":
      case "facebook": return <MessageCircle className="w-4 h-4 text-pink-500" />;
      default: return <Globe className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActionTypeDisplay = (item: BacklogItem) => {
    switch (item.action_type) {
      case "escalation":
        return {
          label: "Escalation",
          variant: "destructive" as const,
          icon: <ArrowUpRight className="w-3 h-3" />,
          borderClass: "border-l-4 border-l-orange-500",
        };
      case "cx_risk_flag":
        return {
          label: "CX Risk",
          variant: "destructive" as const,
          icon: <AlertTriangle className="w-3 h-3" />,
          borderClass: "border-l-4 border-l-red-500",
        };
      case "create_task":
        if (item.action_payload?.task_type === "add_to_order") {
          return {
            label: "Add to Order",
            variant: "secondary" as const,
            icon: null,
            borderClass: "border-l-4 border-l-green-500",
          };
        }
        return {
          label: "Task",
          variant: "secondary" as const,
          icon: null,
          borderClass: "border-l-4 border-l-blue-500",
        };
      default:
        return {
          label: item.action_type,
          variant: "secondary" as const,
          icon: null,
          borderClass: "",
        };
    }
  };

  const openInMightyChat = (conversationId?: string) => {
    if (conversationId) {
      navigate(`/mightychat?id=${conversationId}`);
    }
  };

  const counts = {
    all: items.filter((i) => !i.resolved).length,
    lance: items.filter((i) => !i.resolved && i.action_payload?.assigned_to?.toLowerCase() === "lance").length,
    jackson: items.filter((i) => !i.resolved && i.action_payload?.assigned_to?.toLowerCase() === "jackson").length,
    escalations: items.filter((i) => !i.resolved && (i.action_type === "escalation" || i.action_type === "cx_risk_flag")).length,
    unassigned: items.filter((i) => !i.resolved && !i.action_payload?.assigned_to).length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Backlog & Escalations</h1>
            <p className="text-sm text-muted-foreground">
              Tasks, escalations, and CX risks for Lance & Jackson. Emails are sent automatically.
            </p>
          </div>
          <Button variant="outline" onClick={fetchBacklog} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">
              All <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="escalations">
              Escalations <Badge variant="destructive" className="ml-1">{counts.escalations}</Badge>
            </TabsTrigger>
            <TabsTrigger value="lance">
              Lance <Badge variant="secondary" className="ml-1">{counts.lance}</Badge>
            </TabsTrigger>
            <TabsTrigger value="jackson">
              Jackson <Badge variant="secondary" className="ml-1">{counts.jackson}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unassigned">
              Unassigned <Badge variant="secondary" className="ml-1">{counts.unassigned}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4 space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading backlog...</div>
            ) : pendingItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending items for this filter.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => {
                  const actionDisplay = getActionTypeDisplay(item);
                  return (
                    <Card 
                      key={item.id} 
                      className={`hover:border-primary/30 transition-colors ${actionDisplay.borderClass}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Channel Icon */}
                          <div className="mt-1">
                            {getChannelIcon(item.action_payload?.channel)}
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Customer, Assignee, Type */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                {item.action_payload?.customer_name || "Unknown Customer"}
                              </span>
                              <Badge variant={actionDisplay.variant} className="text-xs flex items-center gap-1">
                                {actionDisplay.icon}
                                {actionDisplay.label}
                              </Badge>
                              {item.action_payload?.assigned_to && (
                                <Badge variant="outline" className="text-xs">
                                  <User className="w-3 h-3 mr-1" />
                                  {item.action_payload.assigned_to}
                                </Badge>
                              )}
                              {item.priority === "urgent" && (
                                <Badge variant="destructive" className="text-xs">
                                  URGENT
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs capitalize">
                                {item.action_payload?.channel || "unknown"}
                              </Badge>
                            </div>

                            {/* Customer Email */}
                            {item.action_payload?.customer_email && (
                              <p className="text-xs text-muted-foreground">
                                {item.action_payload.customer_email}
                              </p>
                            )}

                            {/* Message Excerpt */}
                            {item.action_payload?.source_message_excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded">
                                {item.action_payload.source_message_excerpt}
                              </p>
                            )}

                            {/* Notes or Escalation Reason */}
                            {(item.action_payload?.notes || item.action_payload?.escalation_reason) && (
                              <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                                {item.action_payload.notes || item.action_payload.escalation_reason}
                              </p>
                            )}

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openInMightyChat(item.action_payload?.conversation_id)}
                              disabled={!item.action_payload?.conversation_id}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Open
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markResolved(item.id, item.action_payload?.assigned_to || "Unknown")}
                              disabled={resolvingId === item.id}
                              className="text-green-600 border-green-600/50 hover:bg-green-600/10"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {resolvingId === item.id ? "..." : "Resolved"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Resolved Section */}
            {resolvedItems.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Resolved ({resolvedItems.length})
                </h3>
                <div className="space-y-2 opacity-60">
                  {resolvedItems.slice(0, 10).map((item) => {
                    const actionDisplay = getActionTypeDisplay(item);
                    return (
                      <Card key={item.id} className="bg-muted/30">
                        <CardContent className="p-3 flex items-center gap-3">
                          {getChannelIcon(item.action_payload?.channel)}
                          <Badge variant={actionDisplay.variant} className="text-xs">
                            {actionDisplay.label}
                          </Badge>
                          <span className="text-sm">
                            {item.action_payload?.customer_name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            Resolved by {item.resolved_by} {item.resolved_at ? formatDistanceToNow(new Date(item.resolved_at), { addSuffix: true }) : ""}
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
