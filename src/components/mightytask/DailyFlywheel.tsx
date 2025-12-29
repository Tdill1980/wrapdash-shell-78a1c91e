import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  Instagram,
  Mail,
  MessageSquare,
  Video,
  Check,
  X,
  Clock,
  Loader2,
  Play,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { AgentChatPanel } from "@/components/mightychat/AgentChatPanel";
import { AVAILABLE_AGENTS } from "@/components/mightychat/AgentSelector";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  task_type?: string;
  auto_generated?: boolean;
}

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  instagram_story: Instagram,
  email_campaign: Mail,
  sms_blast: MessageSquare,
  reel_video: Video,
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  instagram_story: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  email_campaign: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  sms_blast: "bg-green-500/20 text-green-400 border-green-500/30",
  reel_video: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function DailyFlywheel() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  
  // Agent execution state
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<Record<string, unknown>>({});

  const executeWithAgent = (task: Task) => {
    // Determine agent based on task_type or default to noah_bennett for content tasks
    let agentId = "noah_bennett"; // Default for content tasks
    
    // Map task types to agents
    if (task.task_type === "email_campaign") {
      agentId = "emily_carter";
    } else if (task.task_type === "instagram_story" || task.task_type === "reel_video") {
      agentId = "noah_bennett";
    }
    
    // Check if agent exists in available agents
    const validAgent = AVAILABLE_AGENTS.find(a => a.id === agentId);
    if (!validAgent) {
      agentId = "noah_bennett"; // Default fallback
    }
    
    setSelectedAgentId(agentId);
    setTaskContext({
      task_id: task.id,
      task_title: task.title,
      task_description: task.description,
      task_priority: task.priority,
      task_due_date: task.due_date,
      task_type: task.task_type,
      source: "daily_flywheel",
      initial_prompt: `Execute this content task: "${task.title}"${task.description ? `\n\nDetails: ${task.description}` : ""}`,
    });
    setShowAgentPanel(true);
    toast.info(`Opening agent chat to execute: ${task.title}`);
  };

  // Fetch tasks for the week (including tasks with no due_date that are pending/pending_review)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["flywheel-tasks", organizationId, format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 7);
      
      // Query 1: Tasks with due_date in range
      let query1 = supabase
        .from("tasks")
        .select("*")
        .gte("due_date", weekStart.toISOString())
        .lt("due_date", weekEnd.toISOString());

      if (organizationId) {
        query1 = query1.eq("organization_id", organizationId);
      }

      const { data: scheduledTasks, error: error1 } = await query1;
      if (error1) throw error1;

      // Query 2: Pending tasks without due_date (show in today's view)
      let query2 = supabase
        .from("tasks")
        .select("*")
        .is("due_date", null)
        .in("status", ["pending", "pending_review", "in_progress"]);

      if (organizationId) {
        query2 = query2.eq("organization_id", organizationId);
      }

      const { data: unscheduledTasks, error: error2 } = await query2;
      if (error2) throw error2;

      // Combine and dedupe
      const allTasks = [...(scheduledTasks || []), ...(unscheduledTasks || [])];
      const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values());
      
      // Sort by priority
      return uniqueTasks.sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, normal: 1, low: 0 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }) as Task[];
    },
    enabled: true,
  });

  // Approve task
  const approveMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flywheel-tasks"] });
      toast.success("Task approved and ready for execution");
    },
  });

  // Reject task
  const rejectMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flywheel-tasks"] });
      toast.success("Task rejected");
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTasksForDay = (date: Date) => {
    // Include unscheduled tasks in today's view
    if (isToday(date)) {
      return tasks.filter((task) => 
        (task.due_date && isSameDay(new Date(task.due_date), date)) || !task.due_date
      );
    }
    return tasks.filter((task) => task.due_date && isSameDay(new Date(task.due_date), date));
  };

  const pendingApprovalTasks = tasks.filter((t) => t.status === "pending_review");

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingApprovalTasks.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Clock className="w-5 h-5" />
              Pending Approval ({pendingApprovalTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovalTasks.map((task) => {
                const Icon = CONTENT_TYPE_ICONS[task.task_type || ""] || Zap;
                const colorClass = CONTENT_TYPE_COLORS[task.task_type || ""] || "bg-muted";
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => executeWithAgent(task)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:bg-red-500/20"
                        onClick={() => rejectMutation.mutate(task.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => approveMutation.mutate(task.id)}
                        disabled={approveMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Daily Flywheel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              const isSelectedDay = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    isSelectedDay
                      ? "bg-primary text-primary-foreground"
                      : isTodayDay
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                  <div className="text-lg font-bold">{format(day, "d")}</div>
                  {dayTasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {dayTasks.length} tasks
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Tasks */}
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              {isToday(selectedDate) ? "Today's Tasks" : format(selectedDate, "EEEE, MMMM d")}
              {isToday(selectedDate) && (
                <Badge variant="outline" className="bg-primary/20">Today</Badge>
              )}
            </h3>
            <ScrollArea className="h-[300px]">
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : getTasksForDay(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks scheduled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getTasksForDay(selectedDate).map((task) => {
                    const Icon = CONTENT_TYPE_ICONS[task.task_type || ""] || Zap;
                    const colorClass = CONTENT_TYPE_COLORS[task.task_type || ""] || "bg-muted";
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          task.status === "completed"
                            ? "bg-green-500/10 border-green-500/30"
                            : task.status === "pending_review"
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-background/50"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-primary border-primary/30 hover:bg-primary/10"
                              onClick={() => executeWithAgent(task)}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Execute
                            </Button>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              task.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : task.status === "in_progress"
                                ? "bg-blue-500/20 text-blue-400"
                                : task.status === "pending_review"
                                ? "bg-amber-500/20 text-amber-400"
                                : ""
                            }
                          >
                            {task.status === "pending_review" ? "Needs Approval" : task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Agent Chat Panel for Task Execution */}
      <AgentChatPanel
        open={showAgentPanel}
        onOpenChange={setShowAgentPanel}
        agentId={selectedAgentId}
        context={taskContext}
      />
    </div>
  );
}
