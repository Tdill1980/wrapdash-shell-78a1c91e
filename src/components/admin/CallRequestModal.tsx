import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, User, Loader2, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlexApprovalModal } from "./AlexApprovalModal";
import { useTeamAvailability } from "@/hooks/useTeamAvailability";

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
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  
  // Team availability for scheduling
  const { getAvailabilityText } = useTeamAvailability();

  // Auto-select owner when reason changes
  const handleReasonChange = (value: string) => {
    setReason(value);
    const reasonConfig = CALL_REASONS.find(r => r.value === value);
    if (reasonConfig?.owner) {
      setAssignedTo(reasonConfig.owner);
    }
  };

  // Generate scheduling email via Alex
  const handleGenerateEmail = async () => {
    if (!reason || !assignedTo || !alexInstruction.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!customerEmail) {
      toast.error("No email address for this customer");
      return;
    }

    setIsGenerating(true);
    try {
      const assignedName = TEAM_MEMBERS.find(m => m.value === assignedTo)?.label?.split(' (')[0] || assignedTo;
      const reasonLabel = CALL_REASONS.find(r => r.value === reason)?.label || reason;
      const availability = getAvailabilityText(assignedTo);
      
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          agent: 'alex_morgan',
          prompt: `You are Alex, writing a professional scheduling email to a customer on behalf of the WePrintWraps team.

TASK: Write a scheduling email to set up a call with ${assignedName}.

CUSTOMER INFO:
- Name: ${customerName || 'Valued Customer'}
- Email: ${customerEmail}
- Phone: ${customerPhone || 'Not provided'}

CALL REASON: ${reasonLabel}

TEAM MEMBER AVAILABILITY:
${assignedName}: ${availability}

INTERNAL INSTRUCTION FROM TEAM:
"${alexInstruction}"

REQUIREMENTS:
1. Write a warm, professional email
2. Propose 2-3 specific time windows based on ${assignedName}'s availability
3. If no availability is set, say "${assignedName} will reach out to find a time that works"
4. Keep it concise (3-4 short paragraphs max)
5. Sign off as "— ${assignedName}, WePrintWraps Team"
6. Body only, no subject line

Write the email now:`,
        },
      });

      if (error) throw error;

      if (data?.reply) {
        const subject = `Let's Schedule a Call - WePrintWraps`;
        setGeneratedEmail({
          subject,
          body: data.reply,
        });
        setShowApprovalModal(true);
      } else {
        throw new Error('No reply received from Alex');
      }
    } catch (err) {
      console.error('Failed to generate scheduling email:', err);
      toast.error('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle successful send from approval modal
  const handleApprovalSuccess = async () => {
    // Log call_requested event with email details
    await supabase.from('conversation_events').insert([{
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
        email_sent: true,
        requested_at: new Date().toISOString(),
      },
    }]);

    toast.success(`Scheduling email sent! Assigned to ${TEAM_MEMBERS.find(m => m.value === assignedTo)?.label?.split(' (')[0]}`);
    
    // Reset form
    setReason("");
    setAssignedTo("");
    setAlexInstruction("");
    setGeneratedEmail(null);
    onOpenChange(false);
    onSuccess();
  };

  // Handle regenerate from approval modal
  const handleRegenerate = async () => {
    setShowApprovalModal(false);
    await handleGenerateEmail();
  };

  return (
    <>
      <Dialog open={open && !showApprovalModal} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Request Call
            </DialogTitle>
            <DialogDescription>
              Alex will draft a scheduling email with time windows for human approval before sending.
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

            {/* No email warning */}
            {!customerEmail && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-400">
                <Mail className="h-4 w-4 inline mr-2" />
                No email captured - cannot send scheduling email
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
              {assignedTo && (
                <p className="text-xs text-muted-foreground">
                  Availability: {getAvailabilityText(assignedTo)}
                </p>
              )}
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
                Alex will draft a professional scheduling email for you to review before sending.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateEmail} 
              disabled={isGenerating || !reason || !assignedTo || !alexInstruction.trim() || !customerEmail}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Scheduling Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal for the generated email */}
      {generatedEmail && customerEmail && (
        <AlexApprovalModal
          open={showApprovalModal}
          onOpenChange={setShowApprovalModal}
          conversationId={conversationId}
          recipient={{
            email: customerEmail,
            name: customerName,
          }}
          subject={generatedEmail.subject}
          body={generatedEmail.body}
          actionType="schedule_call"
          assignedTo={assignedTo}
          onSuccess={handleApprovalSuccess}
          onRegenerate={handleRegenerate}
        />
      )}
    </>
  );
}
