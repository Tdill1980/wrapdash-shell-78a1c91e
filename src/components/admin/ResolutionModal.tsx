import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Receipt, ShoppingCart, XCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Resolution outcomes with their configuration
const RESOLUTION_OUTCOMES = [
  { 
    value: 'quote_given', 
    label: 'Quote Provided', 
    icon: Receipt, 
    requiresInput: 'quote_number' as const,
    inputLabel: 'Quote Number',
    inputPlaceholder: 'e.g. WPW-WEB-260105-4F4B',
    color: 'text-blue-500',
  },
  { 
    value: 'order_placed', 
    label: 'Order Placed', 
    icon: ShoppingCart, 
    requiresInput: 'order_number' as const,
    inputLabel: 'Order Number',
    inputPlaceholder: 'e.g. WPW-12345',
    color: 'text-green-500',
  },
  { 
    value: 'no_quote_needed', 
    label: 'No Quote Needed', 
    icon: CheckCircle, 
    requiresInput: null as null,
    inputLabel: '',
    inputPlaceholder: '',
    color: 'text-muted-foreground',
  },
  { 
    value: 'ongoing_followup', 
    label: 'Ongoing — Follow Up Required', 
    icon: Clock, 
    requiresInput: 'notes' as const,
    inputLabel: 'Follow-up Notes',
    inputPlaceholder: 'What needs to happen next?',
    color: 'text-yellow-500',
  },
  { 
    value: 'lost', 
    label: 'Lost / Not Interested', 
    icon: XCircle, 
    requiresInput: 'reason' as const,
    inputLabel: 'Reason (optional)',
    inputPlaceholder: 'Why did we lose this?',
    color: 'text-red-500',
  },
];

interface ResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  customerName?: string;
  onSuccess: () => void;
}

export function ResolutionModal({
  open,
  onOpenChange,
  conversationId,
  customerName,
  onSuccess,
}: ResolutionModalProps) {
  const [outcome, setOutcome] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOutcome = RESOLUTION_OUTCOMES.find(o => o.value === outcome);

  const handleSubmit = async () => {
    if (!outcome) {
      toast.error("Please select an outcome");
      return;
    }

    // Validate required input (except for optional 'reason' on 'lost')
    if (selectedOutcome?.requiresInput && selectedOutcome.requiresInput !== 'reason' && !inputValue.trim()) {
      toast.error(`Please enter ${selectedOutcome.inputLabel}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the payload based on outcome type
      const payload: Record<string, string | undefined | null> = {
        outcome,
        outcome_label: selectedOutcome?.label,
        resolved_at: new Date().toISOString(),
        customer_name: customerName,
      };

      // Add the specific input value based on outcome
      if (selectedOutcome?.requiresInput === 'quote_number') {
        payload.quote_number = inputValue.trim();
      } else if (selectedOutcome?.requiresInput === 'order_number') {
        payload.order_number = inputValue.trim();
      } else if (selectedOutcome?.requiresInput === 'notes') {
        payload.followup_notes = inputValue.trim();
      } else if (selectedOutcome?.requiresInput === 'reason') {
        payload.lost_reason = inputValue.trim() || 'Not specified';
      }

      // Log the resolved event
      const { error } = await supabase.from('conversation_events').insert([{
        conversation_id: conversationId,
        event_type: 'resolved',
        subtype: outcome,
        actor: 'admin',
        payload: payload as Record<string, string>,
      }]);

      if (error) throw error;

      toast.success(`Escalation resolved: ${selectedOutcome?.label}`);
      
      // Reset form
      setOutcome("");
      setInputValue("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Failed to resolve escalation:", err);
      toast.error("Failed to resolve escalation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Resolve Escalation
          </DialogTitle>
          <DialogDescription>
            Select the outcome to close this escalation and log the result.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer name if available */}
          {customerName && (
            <div className="text-sm text-muted-foreground">
              Resolving escalation for: <span className="font-medium text-foreground">{customerName}</span>
            </div>
          )}

          {/* Outcome Selection */}
          <div className="space-y-3">
            <Label>Select Outcome *</Label>
            <RadioGroup value={outcome} onValueChange={(value) => { setOutcome(value); setInputValue(""); }}>
              {RESOLUTION_OUTCOMES.map((option) => {
                const Icon = option.icon;
                return (
                  <div 
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                      outcome === option.value 
                        ? 'bg-primary/5 border-primary' 
                        : 'hover:bg-muted/50 border-border'
                    }`}
                    onClick={() => { setOutcome(option.value); setInputValue(""); }}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value} 
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Icon className={`h-4 w-4 ${option.color}`} />
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Conditional Input */}
          {selectedOutcome?.requiresInput && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <Label htmlFor="input">
                {selectedOutcome.inputLabel}
                {selectedOutcome.requiresInput !== 'reason' && ' *'}
              </Label>
              {selectedOutcome.requiresInput === 'notes' ? (
                <Textarea
                  id="input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedOutcome.inputPlaceholder}
                  className="min-h-[80px] resize-none"
                />
              ) : (
                <Input
                  id="input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedOutcome.inputPlaceholder}
                />
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !outcome}
            variant={outcome === 'lost' ? 'destructive' : 'default'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Escalation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
