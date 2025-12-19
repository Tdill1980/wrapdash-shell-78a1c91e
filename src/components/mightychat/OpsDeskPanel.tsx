import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  AlertTriangle,
  Clock,
  DollarSign,
  Cog,
  Instagram,
  Mail,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";
import { toast } from "sonner";
import { useOpsTaskEnrichment, EnrichedOpsTask } from "@/hooks/useOpsTaskEnrichment";

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

const INBOX_BADGES: Record<string, string> = {
  design: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40',
  hello: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40',
  jackson: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40'
};

export function OpsDeskPanel({ onTaskSelect }: OpsDeskPanelProps) {
  const { tasks, loading, refresh } = useOpsTaskEnrichment();
  const [selectedTask, setSelectedTask] = useState<EnrichedOpsTask | null>(null);

  const handleApprove = async (task: EnrichedOpsTask) => {
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
      refresh();
    }
  };

  const handleReject = async (task: EnrichedOpsTask) => {
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
      refresh();
    }
  };

  const handleReroute = async () => {
    toast.info('Re-route functionality coming soon');
  };

  const getRevenueImpact = (payload: Record<string, unknown> | null): string => {
    return (payload?.revenue_impact as string) || 'low';
  };

  const pendingCount = tasks.length;
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
                const ChannelIcon = task.channel === 'instagram' ? Instagram : Mail;

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
                    {/* Task Header with Channel */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "p-1 rounded-full",
                        task.channel === 'instagram' 
                          ? "bg-pink-100 text-pink-600 dark:bg-pink-900/40" 
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/40"
                      )}>
                        <ChannelIcon className="w-3 h-3" />
                      </div>
                      {PRIORITY_ICONS[task.priority || 'normal']}
                      <span className="font-medium text-sm flex-1 truncate">
                        {task.action_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <Badge className={cn("text-[10px]", REVENUE_IMPACT_COLORS[revenueImpact])}>
                        {revenueImpact === 'high' ? '🔥' : '▫'}
                      </Badge>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{task.customer_name}</span>
                      {task.channel === 'email' && task.recipient_inbox && (
                        <Badge className={cn("text-[9px]", INBOX_BADGES[task.recipient_inbox] || 'bg-muted')}>
                          {task.recipient_inbox}@
                        </Badge>
                      )}
                    </div>

                    {/* Message Preview */}
                    <div className="text-xs text-muted-foreground mb-1 line-clamp-1">
                      {task.original_message || (task.file_urls.length > 0 ? (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {task.file_urls.length} file(s)
                        </span>
                      ) : 'No message')}
                    </div>

                    {/* Thumbnail */}
                    {task.file_urls.length > 0 && (
                      <div className="flex gap-1 mb-1">
                        {task.file_urls.slice(0, 2).map((url, i) => (
                          <img 
                            key={i}
                            src={url} 
                            alt="" 
                            className="w-10 h-10 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-muted-foreground">
                      {formatTimeAZ(task.created_at)}
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
                            handleReroute();
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
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
