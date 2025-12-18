import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Play, Save, X } from "lucide-react";
import { AgentChatPanel } from "@/components/mightychat/AgentChatPanel";
import { AVAILABLE_AGENTS } from "@/components/mightychat/AgentSelector";

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
  channel?: string | null;
}

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (task: Task) => Promise<void>;
  channelAgentMap?: Record<string, string>;
}

export function TaskDetailModal({ 
  open, 
  onOpenChange, 
  task, 
  onSave,
  channelAgentMap = {}
}: TaskDetailModalProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentContext, setAgentContext] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  const handleSave = async () => {
    if (!editedTask) return;
    setSaving(true);
    try {
      await onSave(editedTask);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAgentChat = () => {
    if (!editedTask) return;
    
    // Determine agent based on channel or assigned_agent
    let agentId = editedTask.assigned_agent;
    if (!agentId && editedTask.channel && channelAgentMap[editedTask.channel]) {
      agentId = channelAgentMap[editedTask.channel];
    }
    if (!agentId) {
      agentId = "noah_bennett"; // Default fallback
    }
    
    // Verify agent exists
    const validAgent = AVAILABLE_AGENTS.find(a => a.id === agentId);
    if (!validAgent) {
      agentId = "noah_bennett";
    }
    
    setSelectedAgentId(agentId);
    setAgentContext({
      task_id: editedTask.id,
      task_title: editedTask.title,
      task_description: editedTask.description,
      task_priority: editedTask.priority,
      task_due_date: editedTask.due_date,
      task_channel: editedTask.channel,
      source: "mightytask",
      initial_prompt: `Execute this task: "${editedTask.title}"${editedTask.description ? `\n\nDetails: ${editedTask.description}` : ""}`,
    });
    setShowAgentChat(true);
  };

  if (!editedTask) return null;

  return (
    <>
      <Dialog open={open && !showAgentChat} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Task Details</span>
              {editedTask.status !== "completed" && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleOpenAgentChat}
                >
                  <Play className="w-4 h-4" />
                  Execute with Agent
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedTask.description || ""}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                placeholder="Add task details..."
                rows={3}
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editedTask.status}
                  onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editedTask.priority}
                  onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="due_date"
                  type="date"
                  value={editedTask.due_date?.split('T')[0] || ""}
                  onChange={(e) => setEditedTask({ 
                    ...editedTask, 
                    due_date: e.target.value ? `${e.target.value}T00:00:00` : null 
                  })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Channel Badge */}
            {editedTask.channel && (
              <div className="flex items-center gap-2">
                <Label>Channel:</Label>
                <Badge variant="secondary">{editedTask.channel}</Badge>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Chat Panel - using the existing component */}
      <AgentChatPanel
        open={showAgentChat}
        onOpenChange={(nextOpen) => {
          setShowAgentChat(nextOpen);
          if (!nextOpen) {
            // When agent chat closes, reopen the task modal
            onOpenChange(true);
          }
        }}
        agentId={selectedAgentId}
        context={agentContext}
      />
    </>
  );
}
