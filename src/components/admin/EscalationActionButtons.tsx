import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Receipt, 
  Ban, 
  Clock, 
  CheckCircle,
  Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EscalationActionButtonsProps {
  conversationId: string;
  hasEmail: boolean;
  isLoading?: boolean;
  onRequestCall: () => void;
  onSendMessage: () => void;
  onResolve: () => void;
  onRefresh: () => void;
}

export function EscalationActionButtons({
  conversationId,
  hasEmail,
  isLoading,
  onRequestCall,
  onSendMessage,
  onResolve,
  onRefresh,
}: EscalationActionButtonsProps) {
  
  // Quick action: Quote Provided (logs event directly)
  const handleQuoteProvided = async () => {
    const quoteNumber = window.prompt("Enter Quote Number:");
    if (!quoteNumber?.trim()) return;

    try {
      await supabase.from('conversation_events').insert([{
        conversation_id: conversationId,
        event_type: 'quote_provided',
        actor: 'admin',
        payload: { 
          quote_number: quoteNumber.trim(),
          provided_at: new Date().toISOString(),
        },
      }]);
      toast.success(`Quote #${quoteNumber} logged!`);
      onRefresh();
    } catch (err) {
      toast.error("Failed to log quote");
    }
  };

  // Quick action: No Quote Needed
  const handleNoQuoteNeeded = async () => {
    try {
      await supabase.from('conversation_events').insert([{
        conversation_id: conversationId,
        event_type: 'marked_no_quote_required',
        actor: 'admin',
        payload: { 
          marked_at: new Date().toISOString(),
        },
      }]);
      toast.success("Marked as no quote needed");
      onRefresh();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  // Quick action: Ongoing / Follow-up
  const handleOngoing = async () => {
    const notes = window.prompt("Follow-up notes (optional):");
    
    try {
      await supabase.from('conversation_events').insert([{
        conversation_id: conversationId,
        event_type: 'marked_ongoing',
        actor: 'admin',
        payload: { 
          followup_notes: notes?.trim() || null,
          marked_at: new Date().toISOString(),
        },
      }]);
      toast.success("Marked as ongoing");
      onRefresh();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">Actions</p>
      
      {/* Primary Actions Row */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="gap-1.5 h-9"
          onClick={onRequestCall}
          disabled={isLoading}
        >
          <Phone className="h-3.5 w-3.5" />
          Request Call
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5 h-9"
          onClick={onSendMessage}
          disabled={isLoading || !hasEmail}
        >
          <Mail className="h-3.5 w-3.5" />
          Send Message
        </Button>
      </div>
      
      {/* Secondary Actions Row */}
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 h-8 text-xs"
          onClick={handleQuoteProvided}
          disabled={isLoading}
        >
          <Receipt className="h-3 w-3" />
          Quote
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 h-8 text-xs"
          onClick={handleNoQuoteNeeded}
          disabled={isLoading}
        >
          <Ban className="h-3 w-3" />
          No Quote
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 h-8 text-xs"
          onClick={handleOngoing}
          disabled={isLoading}
        >
          <Clock className="h-3 w-3" />
          Ongoing
        </Button>
      </div>
      
      {/* Resolve Button */}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full gap-2 h-9 border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-500"
        onClick={onResolve}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Resolve / Close
      </Button>
    </div>
  );
}
