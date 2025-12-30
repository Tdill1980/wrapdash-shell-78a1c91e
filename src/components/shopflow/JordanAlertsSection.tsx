import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgentAlerts, AgentAlert } from "@/hooks/useAgentAlerts";
import { 
  AlertTriangle, 
  MapPin, 
  Package, 
  Users, 
  Wrench, 
  CheckCircle2, 
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const alertTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  missing_tracking: {
    label: "Missing Tracking",
    icon: <Package className="h-4 w-4" />,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  unhappy_customer: {
    label: "Unhappy Customer",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  bulk_inquiry: {
    label: "Bulk/Fleet Inquiry",
    icon: <Users className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  quality_issue: {
    label: "Quality Issue",
    icon: <Wrench className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  design_file: {
    label: "Design/File Issue",
    icon: <MapPin className="h-4 w-4" />,
    color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  },
};

function AlertCard({ 
  alert, 
  onResolve, 
  onAcknowledge 
}: { 
  alert: AgentAlert; 
  onResolve: (alert: AgentAlert) => void;
  onAcknowledge: (alertId: string) => void;
}) {
  const navigate = useNavigate();
  const config = alertTypeConfig[alert.alert_type] || {
    label: alert.alert_type,
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-muted text-muted-foreground",
  };

  const statusBadge = {
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500" },
    acknowledged: { label: "Acknowledged", color: "bg-blue-500/10 text-blue-500" },
    resolved: { label: "Resolved", color: "bg-green-500/10 text-green-500" },
  }[alert.task_status] || { label: alert.task_status, color: "bg-muted" };

  return (
    <Card className="p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={config.color}>
              {config.icon}
              <span className="ml-1.5">{config.label}</span>
            </Badge>
            <Badge variant="outline" className={statusBadge.color}>
              {alert.task_status === "resolved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {alert.task_status === "pending" && <Clock className="h-3 w-3 mr-1" />}
              {statusBadge.label}
            </Badge>
            {alert.priority === "high" && (
              <Badge variant="destructive">HIGH</Badge>
            )}
          </div>

          <div className="space-y-1">
            {alert.order_number && (
              <p className="text-sm">
                <span className="text-muted-foreground">Order:</span>{" "}
                <button
                  className="font-mono text-primary hover:underline"
                  onClick={() => navigate(`/track/${alert.order_number}`)}
                >
                  #{alert.order_number}
                </button>
              </p>
            )}
            {alert.customer_name && (
              <p className="text-sm">
                <span className="text-muted-foreground">Customer:</span>{" "}
                <span className="text-foreground">{alert.customer_name}</span>
              </p>
            )}
            {alert.message_excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                "{alert.message_excerpt}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
            {alert.email_sent_to && alert.email_sent_to.length > 0 && (
              <span className="flex items-center gap-1">
                ✉️ Emailed: {alert.email_sent_to.slice(0, 2).join(", ")}
                {alert.email_sent_to.length > 2 && ` +${alert.email_sent_to.length - 2}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {alert.task_status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Acknowledge
            </Button>
          )}
          {alert.task_status !== "resolved" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onResolve(alert)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Resolve
            </Button>
          )}
          {alert.conversation_id && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/mightychat?conversation=${alert.conversation_id}`)}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              View Chat
            </Button>
          )}
        </div>
      </div>

      {alert.resolved_by && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Resolved by <span className="text-foreground">{alert.resolved_by}</span>
            {alert.resolution_notes && `: ${alert.resolution_notes}`}
          </p>
        </div>
      )}
    </Card>
  );
}

export function JordanAlertsSection() {
  const { 
    alerts, 
    isLoading, 
    pendingCount, 
    pendingAlerts,
    acknowledgedAlerts,
    resolveAlert, 
    acknowledgeAlert,
    alertCounts 
  } = useAgentAlerts();
  
  const [isExpanded, setIsExpanded] = useState(pendingCount > 0);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AgentAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const handleResolve = (alert: AgentAlert) => {
    setSelectedAlert(alert);
    setResolutionNotes("");
    setResolveDialogOpen(true);
  };

  const confirmResolve = () => {
    if (selectedAlert) {
      resolveAlert.mutate({
        alertId: selectedAlert.id,
        resolvedBy: "Team Member", // TODO: Get actual user name
        notes: resolutionNotes || undefined,
      });
      setResolveDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate({ alertId });
  };

  const activeAlerts = [...pendingAlerts, ...acknowledgedAlerts];

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-6 w-32 bg-muted rounded"></div>
          <div className="h-6 w-6 bg-muted rounded-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      Jordan Alerts
                      {pendingCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          {pendingCount} pending
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Escalations from Jordan requiring attention
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {Object.entries(alertCounts).map(([type, count]) => {
                      const config = alertTypeConfig[type];
                      if (!config) return null;
                      return (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {config.icon}
                          <span className="ml-1">{count}</span>
                        </Badge>
                      );
                    })}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border/50 p-4 space-y-4">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>All clear! No pending alerts.</p>
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={handleResolve}
                    onAcknowledge={handleAcknowledge}
                  />
                ))
              )}

              {alerts.length > activeAlerts.length && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  + {alerts.length - activeAlerts.length} resolved alerts
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved. Add optional notes about the resolution.
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  {alertTypeConfig[selectedAlert.alert_type]?.label || selectedAlert.alert_type}
                </p>
                {selectedAlert.order_number && (
                  <p className="text-sm text-muted-foreground">
                    Order #{selectedAlert.order_number}
                  </p>
                )}
                {selectedAlert.customer_name && (
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.customer_name}
                  </p>
                )}
              </div>

              <Textarea
                placeholder="Resolution notes (optional)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResolve} disabled={resolveAlert.isPending}>
              {resolveAlert.isPending ? "Resolving..." : "Mark Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
