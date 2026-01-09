import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Call reasons with default owners
const CALL_REASONS = [
  { value: 'bulk_fleet', label: 'Bulk / Fleet Order', owner: 'jackson' },
  { value: 'rush_timeline', label: 'Rush Timeline', owner: 'jackson' },
  { value: 'ongoing_printing', label: 'Ongoing Printing Needs', owner: 'jackson' },
  { value: 'sponsored_artist', label: 'Sponsored Wrap Artist / Affiliate', owner: 'trish' },
  { value: 'ink_edge', label: 'Ink & Edge Magazine Feature', owner: 'trish' },
  { value: 'strategic_partnership', label: 'Strategic Partnership', owner: 'trish' },
  { value: 'design_file', label: 'Design / File Review', owner: 'lance' },
  { value: 'production_issue', label: 'Production Issue', owner: 'manny' },
  { value: 'other', label: 'Other', owner: 'jackson' },
] as const;

// Team members who can take calls
const TEAM_MEMBERS = [
  { value: 'jackson', label: 'Jackson (CommercialPro / Bulk / Fleet)' },
  { value: 'lance', label: 'Lance (Design / Files / Production)' },
  { value: 'trish', label: 'Trish (VIP / Partnership / Media)' },
  { value: 'manny', label: 'Manny (Production / Issue Resolution)' },
  { value: 'brice', label: 'Brice (General)' },
] as const;

interface CallRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: () => void;
}

export function CallRequestModal({
  open,
  onOpenChange,
  conversationId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
}: CallRequestModalProps) {
  const [reason, setReason] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [alexInstruction, setAlexInstruction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select owner when reason changes
  const handleReasonChange = (value: string) => {
    setReason(value);
    const reasonConfig = CALL_REASONS.find(r => r.value === value);
    if (reasonConfig?.owner) {
      setAssignedTo(reasonConfig.owner);
    }
  };

  const handleSubmit = async () => {
    if (!reason || !assignedTo || !alexInstruction.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Log the call_requested event
      const { error } = await supabase.from('conversation_events').insert([{
        conversation_id: conversationId,
        event_type: 'call_requested',
        subtype: reason,
        actor: 'admin',
        payload: {
          call_reason: reason,
          call_reason_label: CALL_REASONS.find(r => r.value === reason)?.label,
          assigned_to: assignedTo,
          assigned_to_label: TEAM_MEMBERS.find(m => m.value === assignedTo)?.label,
          alex_instruction: alexInstruction.trim(),
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          requested_at: new Date().toISOString(),
        },
      }]);

      if (error) throw error;

      toast.success(`Call request created! Assigned to ${TEAM_MEMBERS.find(m => m.value === assignedTo)?.label?.split(' (')[0]}`);
      
      // Reset form
      setReason("");
      setAssignedTo("");
      setAlexInstruction("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Failed to create call request:", err);
      toast.error("Failed to create call request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Request Call
          </DialogTitle>
          <DialogDescription>
            Alex will draft outreach to schedule a call with this customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer info summary */}
          {customerName && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{customerName}</span>
              </div>
              {customerEmail && <div className="text-xs text-muted-foreground ml-6">{customerEmail}</div>}
              {customerPhone && <div className="text-xs text-green-500 ml-6">{customerPhone}</div>}
            </div>
          )}

          {/* Step A: Call Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Why are we calling? *</Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {CALL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step B: Assign to */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Who should take the call? *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step C: Alex Instruction */}
          <div className="space-y-2">
            <Label htmlFor="instruction">Instruction for Alex *</Label>
            <Textarea
              id="instruction"
              value={alexInstruction}
              onChange={(e) => setAlexInstruction(e.target.value)}
              placeholder='e.g. "Let them know Jackson would like to discuss bulk fleet pricing and ongoing printing needs."'
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Alex will polish this into a professional message for human approval before sending.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason || !assignedTo || !alexInstruction.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Create Call Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
