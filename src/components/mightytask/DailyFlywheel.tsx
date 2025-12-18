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
  Target,
  Zap,
  Instagram,
  Mail,
  MessageSquare,
  Video,
  Check,
  X,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";

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

interface SalesData {
  todayRevenue: number;
  dailyTarget: number;
  status: string;
  percentComplete: number;
  dailyPaceRequired: number;
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

  // Fetch tasks for the week
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["flywheel-tasks", organizationId, format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 7);
      let query = supabase
        .from("tasks")
        .select("*")
        .gte("due_date", weekStart.toISOString())
        .lt("due_date", weekEnd.toISOString())
        .order("priority", { ascending: false });

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: true,
  });

  // Fetch today's sales data
  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ["daily-sales-check"],
    queryFn: async (): Promise<SalesData> => {
      const { data, error } = await supabase.functions.invoke("sync-woocommerce-sales");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as SalesData;
    },
    refetchInterval: 300000, // 5 minutes
  });

  // Trigger autopilot check
  const autopilotMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sales-goal-autopilot", {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["flywheel-tasks"] });
      if (data.tasksCreated > 0) {
        toast.success(`AI created ${data.tasksCreated} content tasks for review`, {
          description: "Approve them in the task list below",
        });
      } else {
        toast.info("Sales on track - no additional content needed");
      }
    },
    onError: (error) => {
      toast.error("Failed to run autopilot", { description: error.message });
    },
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
    return tasks.filter((task) => task.due_date && isSameDay(new Date(task.due_date), date));
  };

  const todayTasks = getTasksForDay(new Date());
  const pendingApprovalTasks = todayTasks.filter((t) => t.status === "pending_review");
  const todayBehind = salesData ? salesData.todayRevenue < salesData.dailyTarget : false;

  return (
    <div className="space-y-6">
      {/* Sales Status Banner */}
      <Card className={`border-2 ${todayBehind ? "border-red-500/50 bg-red-500/5" : "border-green-500/50 bg-green-500/5"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${todayBehind ? "bg-red-500/20" : "bg-green-500/20"}`}>
                <Target className={`w-6 h-6 ${todayBehind ? "text-red-400" : "text-green-400"}`} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Today's Sales</div>
                <div className="text-2xl font-bold">
                  ${salesData?.todayRevenue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "..."} 
                  <span className="text-sm font-normal text-muted-foreground"> / $10,000 goal</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchSales()}
                disabled={salesLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${salesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={() => autopilotMutation.mutate()}
                disabled={autopilotMutation.isPending}
                className={todayBehind ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {autopilotMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Run AI Autopilot
              </Button>
            </div>
          </div>
          {todayBehind && salesData && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>
                ${(salesData.dailyTarget - salesData.todayRevenue).toLocaleString(undefined, { maximumFractionDigits: 0 })} behind daily goal — AI can create content to boost sales
              </span>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <p className="text-xs">Run AI Autopilot to generate content tasks</p>
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
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
