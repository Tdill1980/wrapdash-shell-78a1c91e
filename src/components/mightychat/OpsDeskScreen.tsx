import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  AlertTriangle,
  Clock,
  DollarSign,
  Cog,
  X,
  Instagram,
  Mail,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";
import { toast } from "sonner";
import { OpsDeskCommandPanel } from "./OpsDeskCommandPanel";
import { OpsTaskDetailCard } from "./OpsTaskDetailCard";
import { useOpsTaskEnrichment, EnrichedOpsTask } from "@/hooks/useOpsTaskEnrichment";

interface OpsDeskScreenProps {
  onClose: () => void;
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

export function OpsDeskScreen({ onClose }: OpsDeskScreenProps) {
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
      setSelectedTask(null);
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
      setSelectedTask(null);
      refresh();
    }
  };

  const handleReroute = async (task: EnrichedOpsTask) => {
    toast.info('Re-route functionality coming soon');
  };

  const getRevenueImpact = (payload: Record<string, unknown> | null): string => {
    return (payload?.revenue_impact as string) || 'low';
  };

  const pendingCount = tasks.length;
  const cxRiskCount = tasks.filter(t => t.priority === 'urgent').length;
  const highRevenueCount = tasks.filter(t => getRevenueImpact(t.action_payload) === 'high').length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-red-50 dark:bg-red-950/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cog className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400">OPS DESK</h2>
            <p className="text-xs text-red-600/80">Execution requires approval.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="destructive" className="text-sm">{pendingCount} Pending</Badge>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Command Panel */}
      <OpsDeskCommandPanel />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b bg-muted/30">
        <div className="text-center p-3 rounded-lg bg-background">
          <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
          <div className="text-xs text-muted-foreground uppercase">Pending</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-background">
          <div className="text-2xl font-bold text-red-600">{cxRiskCount}</div>
          <div className="text-xs text-muted-foreground uppercase">CX Risk</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-background">
          <div className="text-2xl font-bold text-orange-600">{highRevenueCount}</div>
          <div className="text-xs text-muted-foreground uppercase">High Rev</div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List */}
        <ScrollArea className="flex-1 border-r">
          <div className="p-4">
            {loading ? (
              <div className="text-muted-foreground text-center py-8">Loading...</div>
            ) : tasks.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg">All tasks cleared</p>
                <p className="text-sm mt-1">Nothing requires your attention</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const revenueImpact = getRevenueImpact(task.action_payload);
                  const isSelected = selectedTask?.id === task.id;
                  const ChannelIcon = task.channel === 'instagram' ? Instagram : Mail;

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors bg-card",
                        isSelected && "ring-2 ring-primary bg-muted/50",
                        task.priority === 'urgent' && "border-l-4 border-l-red-500"
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Task Header with Channel Icon */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "p-1.5 rounded-full",
                          task.channel === 'instagram' 
                            ? "bg-pink-100 text-pink-600 dark:bg-pink-900/40" 
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/40"
                        )}>
                          <ChannelIcon className="w-3.5 h-3.5" />
                        </div>
                        {PRIORITY_ICONS[task.priority || 'normal']}
                        <span className="font-semibold text-sm flex-1 truncate">
                          {task.action_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <Badge className={cn("text-xs", REVENUE_IMPACT_COLORS[revenueImpact])}>
                          {revenueImpact === 'high' ? '🔥' : revenueImpact === 'medium' ? '◼' : '▫'}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{task.customer_name}</span>
                        {task.channel === 'email' && task.recipient_inbox && (
                          <Badge className={cn("text-[10px]", INBOX_BADGES[task.recipient_inbox] || 'bg-muted')}>
                            via {task.recipient_inbox}@
                          </Badge>
                        )}
                      </div>

                      {/* Message Preview or File Count */}
                      <div className="text-xs text-muted-foreground mb-2">
                        {task.original_message ? (
                          <span className="line-clamp-2">{task.original_message}</span>
                        ) : task.file_urls.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {task.file_urls.length} file(s) attached
                          </span>
                        ) : (
                          <span className="italic">No message</span>
                        )}
                      </div>

                      {/* Thumbnail Preview */}
                      {task.file_urls.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {task.file_urls.slice(0, 3).map((url, i) => (
                            <img 
                              key={i}
                              src={url} 
                              alt="" 
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ))}
                          {task.file_urls.length > 3 && (
                            <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{task.file_urls.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Time */}
                      <div className="text-[10px] text-muted-foreground">
                        {formatTimeAZ(task.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Detail Panel */}
        <div className="w-[400px] bg-muted/20 overflow-auto">
          {selectedTask ? (
            <div className="p-4">
              <OpsTaskDetailCard
                task={selectedTask}
                onApprove={() => handleApprove(selectedTask)}
                onReject={() => handleReject(selectedTask)}
                onReroute={() => handleReroute(selectedTask)}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p className="text-center">
                <Cog className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Select a task to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground italic">
          Talk in chat. Execute in Ops Desk. Design in ApproveFlow.
        </p>
      </div>
    </div>
  );
}
