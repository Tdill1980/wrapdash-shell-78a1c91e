import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Edit, 
  AlertTriangle,
  Clock,
  DollarSign,
  User,
  Cog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OpsTask {
  id: string;
  action_type: string;
  action_payload: Record<string, unknown> | null;
  priority: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string | null;
}

interface OpsDeskPanelProps {
  onTaskSelect?: (taskId: string) => void;
}

const REVENUE_IMPACT_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800'
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  urgent: <AlertTriangle className="w-4 h-4 text-red-600" />,
  high: <DollarSign className="w-4 h-4 text-orange-600" />,
  normal: <Clock className="w-4 h-4 text-muted-foreground" />
};

export function OpsDeskPanel({ onTaskSelect }: OpsDeskPanelProps) {
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<OpsTask | null>(null);

  useEffect(() => {
    loadTasks();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('ops-desk-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_actions' },
        () => loadTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data as OpsTask[]);
    }
    setLoading(false);
  };

  const handleApprove = async (task: OpsTask) => {
    const { error } = await supabase
      .from('ai_actions')
      .update({ 
        resolved: true, 
        resolved_at: new Date().toISOString(),
        resolved_by: 'orchestrator'
      })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to approve task');
    } else {
      toast.success('Task approved and deployed');
      loadTasks();
    }
  };

  const handleReject = async (task: OpsTask) => {
    const { error } = await supabase
      .from('ai_actions')
      .update({ 
        resolved: true, 
        resolved_at: new Date().toISOString(),
        resolved_by: 'orchestrator',
        action_payload: { ...task.action_payload, status: 'rejected' }
      })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to reject task');
    } else {
      toast.success('Task rejected');
      loadTasks();
    }
  };

  const handleReroute = async (task: OpsTask) => {
    toast.info('Re-route functionality coming soon');
  };

  const getRevenueImpact = (payload: Record<string, unknown> | null): string => {
    return (payload?.revenue_impact as string) || 'low';
  };

  const getRequestedBy = (payload: Record<string, unknown> | null): string => {
    return (payload?.requested_by as string) || 'System';
  };

  const getAssignedTo = (payload: Record<string, unknown> | null): string => {
    return (payload?.assigned_to as string) || 'Unassigned';
  };

  const getCustomer = (payload: Record<string, unknown> | null): string => {
    return (payload?.customer_name as string) || 'Unknown';
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Stats
  const pendingCount = tasks.filter(t => !t.resolved).length;
  const cxRiskCount = tasks.filter(t => t.priority === 'urgent').length;
  const highRevenueCount = tasks.filter(t => getRevenueImpact(t.action_payload) === 'high').length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 bg-red-50 dark:bg-red-950/30 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cog className="w-5 h-5 text-red-600" />
            <span className="text-red-700 dark:text-red-400">OPS DESK</span>
          </CardTitle>
          <Badge variant="destructive">{pendingCount} Pending</Badge>
        </div>
        <p className="text-xs text-red-600/80 mt-1">
          Execution requires approval.
        </p>
      </CardHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b bg-muted/30">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{pendingCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{cxRiskCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase">CX Risk</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">{highRevenueCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase">High Rev</div>
        </div>
      </div>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-450px)]">
          {loading ? (
            <div className="p-4 text-muted-foreground text-center">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="p-4 text-muted-foreground text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p>All tasks cleared</p>
            </div>
          ) : (
            <div className="divide-y">
              {tasks.map((task) => {
                const revenueImpact = getRevenueImpact(task.action_payload);
                const isSelected = selectedTask?.id === task.id;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      isSelected && "bg-muted",
                      task.priority === 'urgent' && "border-l-4 border-l-red-500"
                    )}
                    onClick={() => {
                      setSelectedTask(task);
                      onTaskSelect?.(task.id);
                    }}
                  >
                    {/* Task Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {PRIORITY_ICONS[task.priority || 'normal']}
                      <span className="font-medium text-sm flex-1 truncate">
                        {task.action_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <Badge className={cn("text-[10px]", REVENUE_IMPACT_COLORS[revenueImpact])}>
                        {revenueImpact === 'high' ? '🔥' : revenueImpact === 'medium' ? '◼' : '▫'} {revenueImpact}
                      </Badge>
                    </div>

                    {/* Task Details */}
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>From: {getRequestedBy(task.action_payload)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>To: {getAssignedTo(task.action_payload)}</span>
                      </div>
                      <div>Customer: {getCustomer(task.action_payload)}</div>
                      <div>{formatTime(task.created_at)}</div>
                    </div>

                    {/* Action Buttons */}
                    {isSelected && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(task);
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReroute(task);
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Re-route
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(task);
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Footer Rule */}
      <div className="p-3 border-t bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground italic">
          Talk in chat. Execute in Ops Desk. Design in ApproveFlow.
        </p>
      </div>
    </Card>
  );
}
