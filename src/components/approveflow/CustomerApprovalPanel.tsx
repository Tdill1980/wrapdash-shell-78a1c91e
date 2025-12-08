import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, Edit3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CustomerApprovalPanelProps {
  projectId: string;
  projectStatus: string;
  organizationId?: string;
  onApprove?: () => void;
  onRequestRevision?: (notes: string) => void;
}

export default function CustomerApprovalPanel({
  projectId,
  projectStatus,
  organizationId,
  onApprove,
  onRequestRevision,
}: CustomerApprovalPanelProps) {
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Update project status
      await supabase
        .from("approveflow_projects")
        .update({ status: "approved" })
        .eq("id", projectId);

      // Add chat message
      await supabase.from("approveflow_chat").insert({
        project_id: projectId,
        sender: "customer",
        message: "✅ Design Approved",
      });

      // Add action record
      await supabase.from("approveflow_actions").insert({
        project_id: projectId,
        action_type: "approved",
        payload: { approved_at: new Date().toISOString() },
      });

      toast({
        title: "Design Approved",
        description: "Your design has been approved and is ready for production!",
      });

      onApprove?.();
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval Failed",
        description: "Unable to approve design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!revisionNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide details about what needs to be changed.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Add chat message with revision request
      await supabase.from("approveflow_chat").insert({
        project_id: projectId,
        sender: "customer",
        message: `🔄 **Revision Requested**\n\n${revisionNotes}`,
      });

      // Update project status
      await supabase
        .from("approveflow_projects")
        .update({ status: "revision_requested" })
        .eq("id", projectId);

      // Add action record
      await supabase.from("approveflow_actions").insert({
        project_id: projectId,
        action_type: "revision_requested",
        payload: { notes: revisionNotes },
      });

      // Create task for designer
      if (organizationId) {
        await supabase.from("tasks").insert({
          organization_id: organizationId,
          title: "Revision Requested",
          description: revisionNotes,
          priority: "high",
          status: "pending",
        });
      }

      toast({
        title: "Revision Submitted",
        description: "Your feedback has been sent to the design team.",
      });

      setRevisionNotes("");
      setDialogOpen(false);
      onRequestRevision?.(revisionNotes);
    } catch (error) {
      console.error("Revision submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit revision request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApproved = projectStatus === "approved";

  if (isApproved) {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-400">Design Approved</p>
              <p className="text-xs text-muted-foreground">This design is ready for production</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Customer Approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Review the proof sheet above. Once satisfied, approve the design for production or request changes.
        </p>

        <div className="flex gap-3">
          <Button 
            onClick={handleApprove}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Approve Design
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit3 className="w-4 h-4 mr-2" />
                Request Revisions
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Revisions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Please describe what changes you'd like made to the design.
                </p>
                <Textarea
                  placeholder="e.g., Change the blue accent to red, make the logo larger on the hood..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitRevision}
                    disabled={isSubmitting || !revisionNotes.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
