import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import {
  CheckCircle,
  Circle,
  Clock,
  Plus,
  Search,
  Filter,
  Camera,
  Upload,
  Calendar,
  Car,
  CheckSquare,
  Mail,
  Loader2,
  MoreVertical,
  Trash,
  Zap,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DailyFlywheel } from "@/components/mightytask/DailyFlywheel";
import { AgentChatPanel } from "@/components/mightychat/AgentChatPanel";
import { AVAILABLE_AGENTS } from "@/components/mightychat/AgentSelector";

// Standard job tasks that auto-generate
export const STANDARD_JOB_TASKS = [
  { title: "Take Before Photos", icon: Camera, priority: "high" },
  { title: "Upload/Request Design Files", icon: Upload, priority: "high" },
  { title: "Send for Customer Approval", icon: Mail, priority: "medium" },
  { title: "Schedule Install Date", icon: Calendar, priority: "medium" },
  { title: "Vehicle Check-In", icon: Car, priority: "medium" },
  { title: "Complete Installation", icon: CheckSquare, priority: "high" },
  { title: "Take After Photos", icon: Camera, priority: "medium" },
  { title: "Send Thank You Email", icon: Mail, priority: "low" },
];

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  order_id: string | null;
  created_at: string;
  assigned_agent?: string | null;
}

type ViewMode = "todo" | "inprogress" | "done" | "all";

export default function MightyTasks() {
  const { organizationId } = useOrganization();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Agent execution state
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<Record<string, unknown>>({});

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [organizationId]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (viewMode === "all") return matchesSearch;
    if (viewMode === "todo") return matchesSearch && task.status === "pending";
    if (viewMode === "inprogress") return matchesSearch && task.status === "in_progress";
    if (viewMode === "done") return matchesSearch && task.status === "completed";
    return matchesSearch;
  });

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );
      toast.success(`Task marked as ${newStatus.replace("_", " ")}`);
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsAddingTask(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTaskTitle,
          status: "pending",
          priority: "normal",
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      setTasks((prev) => [data, ...prev]);
      setNewTaskTitle("");
      toast.success("Task added");
    } catch (err) {
      toast.error("Failed to add task");
    } finally {
      setIsAddingTask(false);
    }
  };

  const executeWithAgent = (task: Task) => {
    // Determine agent based on task.assigned_agent or default to noah_bennett for content tasks
    let agentId = task.assigned_agent || "noah_bennett";
    
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
      source: "mightytask",
      initial_prompt: `Execute this task: "${task.title}"${task.description ? `\n\nDetails: ${task.description}` : ""}`,
    });
    setShowAgentPanel(true);
    toast.info(`Opening agent chat to execute: ${task.title}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-500";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const todoCount = tasks.filter((t) => t.status === "pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-['Poppins',sans-serif]">
              <span className="text-foreground">Mighty</span>
              <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Task</span>
              <span className="text-muted-foreground text-lg align-super">™</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your orchestrator task list — AI-powered daily flywheel to hit sales goals
            </p>
          </div>
        </div>

        {/* Tabs for Flywheel vs All Tasks */}
        <Tabs defaultValue="flywheel" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="flywheel" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Daily Flywheel
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              All Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flywheel" className="mt-4">
            <DailyFlywheel />
          </TabsContent>

          <TabsContent value="all" className="mt-4 space-y-4">

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card
            className={`cursor-pointer transition-all ${
              viewMode === "todo" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setViewMode("todo")}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{todoCount}</div>
              <div className="text-sm text-muted-foreground">To Do</div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              viewMode === "inprogress" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setViewMode("inprogress")}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{inProgressCount}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              viewMode === "done" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setViewMode("done")}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{doneCount}</div>
              <div className="text-sm text-muted-foreground">Done</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Task + Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            onClick={() => setViewMode("all")}
          >
            <Filter className="w-4 h-4 mr-2" />
            All
          </Button>
        </div>

        {/* Quick Add Task */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <Button onClick={addTask} disabled={isAddingTask || !newTaskTitle.trim()}>
                {isAddingTask ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No tasks found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tasks auto-generate when orders are converted, or add your own above
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="bg-card border-border hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Status Toggle */}
                    <button
                      onClick={() =>
                        updateTaskStatus(
                          task.id,
                          task.status === "completed"
                            ? "pending"
                            : task.status === "pending"
                            ? "in_progress"
                            : "completed"
                        )
                      }
                      className="flex-shrink-0"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : task.status === "in_progress" ? (
                        <Clock className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            task.status === "completed"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}

                    {/* Execute with Agent Button */}
                    {task.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary border-primary/30 hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          executeWithAgent(task);
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Execute
                      </Button>
                    )}

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => executeWithAgent(task)}>
                          <Play className="w-4 h-4 mr-2" />
                          Execute with Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "pending")}>
                          <Circle className="w-4 h-4 mr-2" />
                          Mark To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "in_progress")}>
                          <Clock className="w-4 h-4 mr-2" />
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "completed")}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Done
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteTask(task.id)}
                          className="text-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Agent Chat Panel for Task Execution */}
      <AgentChatPanel
        open={showAgentPanel}
        onOpenChange={setShowAgentPanel}
        agentId={selectedAgentId}
        context={taskContext}
      />
    </MainLayout>
  );
}
