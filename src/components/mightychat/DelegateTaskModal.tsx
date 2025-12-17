import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, Zap } from "lucide-react";

interface DelegateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  suggestedTask: { type: string; description: string } | null;
  onDelegate: (description: string) => void;
}

export function DelegateTaskModal({
  open,
  onOpenChange,
  agentName,
  suggestedTask,
  onDelegate,
}: DelegateTaskModalProps) {
  const [description, setDescription] = useState(suggestedTask?.description || "");
  const [delegating, setDelegating] = useState(false);

  const handleDelegate = async () => {
    if (!description.trim()) return;
    setDelegating(true);
    await onDelegate(description.trim());
    setDelegating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Confirm Delegation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <div className="font-medium">{agentName}</div>
              <div className="text-xs text-muted-foreground">will execute this task</div>
            </div>
          </div>

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
                  <li>• Agent will begin execution</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelegate} disabled={!description.trim() || delegating}>
            {delegating ? "Delegating..." : "Delegate Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
