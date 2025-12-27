import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, Zap, Loader2, ExternalLink, AlertCircle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExecutionResult {
  success: boolean;
  status?: string;
  output_url?: string;
  error?: string;
}

interface DelegateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  suggestedTask: { type: string; description: string } | null;
  onDelegate: (description: string) => Promise<{ 
    success: boolean; 
    taskId?: string;
    execution?: ExecutionResult;
  }>;
  linkedThread?: {
    subject?: string;
    inboxLabel?: string;
    conversationId?: string;
  };
  onOpenThread?: (conversationId: string) => void;
}

export function DelegateTaskModal({
  open,
  onOpenChange,
  agentName,
  suggestedTask,
  onDelegate,
  linkedThread,
  onOpenThread,
}: DelegateTaskModalProps) {
  const [description, setDescription] = useState(suggestedTask?.description || "");
  const [delegating, setDelegating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "executing" | "completed" | "failed">("idle");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [progress, setProgress] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setDescription(suggestedTask?.description || "");
      setDelegating(false);
      setTaskId(null);
      setExecutionStatus("idle");
      setExecutionResult(null);
      setProgress(0);
    }
  }, [open, suggestedTask]);

  // Poll for task status while executing
  useEffect(() => {
    if (!taskId || executionStatus !== "executing") return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: task } = await supabase
          .from("tasks")
          .select("status, notes")
          .eq("id", taskId)
          .single();

        if (task) {
          // Update progress based on status
          if (task.status === "in_progress") {
            setProgress(prev => Math.min(prev + 10, 80));
          } else if (task.status === "completed") {
            setProgress(100);
            setExecutionStatus("completed");
            
            // Extract output URL from notes if present
            const urlMatch = task.notes?.match(/Output: (https?:\/\/[^\s]+)/);
            setExecutionResult({
              success: true,
              status: "completed",
              output_url: urlMatch?.[1],
            });
          } else if (task.status === "failed") {
            setExecutionStatus("failed");
            setExecutionResult({
              success: false,
              status: "failed",
              error: task.notes || "Execution failed",
            });
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [taskId, executionStatus]);

  const handleDelegate = async () => {
    if (!description.trim()) return;
    
    setDelegating(true);
    setExecutionStatus("executing");
    setProgress(10);
    
    const result = await onDelegate(description.trim());
    
    setDelegating(false);
    
    if (result.success && result.taskId) {
      setTaskId(result.taskId);
      setProgress(30);
      
      // If we got immediate execution result
      if (result.execution) {
        if (result.execution.success) {
          setProgress(100);
          setExecutionStatus("completed");
          setExecutionResult(result.execution);
        } else {
          setExecutionStatus("failed");
          setExecutionResult(result.execution);
        }
      }
    } else {
      setExecutionStatus("failed");
      setExecutionResult({ success: false, error: "Failed to delegate task" });
    }
  };

  const getStatusContent = () => {
    switch (executionStatus) {
      case "executing":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div className="flex-1">
                <div className="font-medium text-primary">Executing...</div>
                <div className="text-xs text-muted-foreground">
                  Creating content, please wait
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        );
      
      case "completed":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div className="flex-1">
                <div className="font-medium text-emerald-500">Execution Complete!</div>
                <div className="text-xs text-muted-foreground">
                  Content has been created successfully
                </div>
              </div>
            </div>
            
            {executionResult?.output_url && (
              <Button 
                className="w-full gap-2"
                onClick={() => window.open(executionResult.output_url, "_blank")}
              >
                <Play className="w-4 h-4" />
                View Output
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            )}
          </div>
        );
      
      case "failed":
        return (
          <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div className="flex-1">
              <div className="font-medium text-destructive">Execution Failed</div>
              <div className="text-xs text-muted-foreground">
                {executionResult?.error || "An error occurred during execution"}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      // Don't allow closing while executing
      if (executionStatus === "executing") return;
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {executionStatus === "idle" ? "Confirm Delegation" : 
             executionStatus === "executing" ? "Executing Task..." :
             executionStatus === "completed" ? "Task Complete" : "Execution Status"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Info - always show */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <div className="font-medium">{agentName}</div>
              <div className="text-xs text-muted-foreground">
                {executionStatus === "idle" ? "will execute this task" : 
                 executionStatus === "executing" ? "is working on it..." :
                 executionStatus === "completed" ? "completed the task" : "agent"}
              </div>
            </div>
          </div>

          {/* Show execution status when not idle */}
          {executionStatus !== "idle" && getStatusContent()}

          {/* Only show form when idle */}
          {executionStatus === "idle" && (
            <>
              {linkedThread?.subject && (
                <div className="p-3 rounded-lg border bg-card/40">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Replying to
                  </div>
                  <div className="text-sm font-medium mt-1 truncate">{linkedThread.subject}</div>
                  {linkedThread.inboxLabel && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{linkedThread.inboxLabel}</div>
                  )}
                  {linkedThread.conversationId && onOpenThread && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenThread(linkedThread.conversationId!)}
                      >
                        Open thread
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="task-description">Task Description</Label>
                <Input
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What should the agent do?"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-emerald-500">This will:</div>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• Create a task for {agentName}</li>
                      <li>• Log the delegation for audit</li>
                      <li>• <strong>Immediately begin execution</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {executionStatus === "idle" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleDelegate} disabled={!description.trim() || delegating}>
                {delegating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Delegate & Execute"
                )}
              </Button>
            </>
          )}
          
          {executionStatus === "executing" && (
            <div className="text-xs text-muted-foreground text-center w-full">
              Please wait while the task is being executed...
            </div>
          )}
          
          {(executionStatus === "completed" || executionStatus === "failed") && (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
