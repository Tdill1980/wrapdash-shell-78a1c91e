import { Button } from "@/components/ui/button";
import { 
  Send, 
  ListTodo, 
  AlertTriangle, 
  ArrowUpRight, 
  Palette,
  Cog
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationActionsBarProps {
  conversationId: string;
  contactId: string | null;
  channel: string;
  customerName?: string;
}

export function ConversationActionsBar({
  conversationId,
  contactId,
  channel,
  customerName
}: ConversationActionsBarProps) {
  const navigate = useNavigate();

  const handleRouteToOpsDesk = async () => {
    try {
      const { error } = await supabase
        .from('ai_actions')
        .insert({
          action_type: 'conversation_review',
          action_payload: {
            conversation_id: conversationId,
            contact_id: contactId,
            channel,
            customer_name: customerName,
            requested_by: 'MightyChat',
            revenue_impact: 'medium'
          },
          priority: 'normal'
        });

      if (error) throw error;
      toast.success('Routed to Ops Desk');
    } catch (err) {
      console.error('Route to Ops Desk error:', err);
      toast.error('Failed to route to Ops Desk');
    }
  };

  const handleCreateTask = async () => {
    try {
      const { error } = await supabase
        .from('ai_actions')
        .insert({
          action_type: 'create_task',
          action_payload: {
            conversation_id: conversationId,
            contact_id: contactId,
            customer_name: customerName,
            task_type: 'follow_up',
            requested_by: 'MightyChat',
            revenue_impact: 'low'
          },
          priority: 'normal'
        });

      if (error) throw error;
      toast.success('Task created');
    } catch (err) {
      console.error('Create task error:', err);
      toast.error('Failed to create task');
    }
  };

  const handleFlagCXRisk = async () => {
    try {
      const { error } = await supabase
        .from('ai_actions')
        .insert({
          action_type: 'cx_risk_flag',
          action_payload: {
            conversation_id: conversationId,
            contact_id: contactId,
            customer_name: customerName,
            requested_by: 'MightyChat',
            revenue_impact: 'high',
            assigned_to: 'Jackson'
          },
          priority: 'urgent'
        });

      if (error) throw error;
      
      // Also update conversation priority
      await supabase
        .from('conversations')
        .update({ priority: 'urgent' })
        .eq('id', conversationId);

      toast.success('CX Risk flagged - Jackson notified');
    } catch (err) {
      console.error('Flag CX Risk error:', err);
      toast.error('Failed to flag CX Risk');
    }
  };

  const handleEscalate = async () => {
    try {
      const { error } = await supabase
        .from('ai_actions')
        .insert({
          action_type: 'escalation',
          action_payload: {
            conversation_id: conversationId,
            contact_id: contactId,
            customer_name: customerName,
            requested_by: 'MightyChat',
            revenue_impact: 'high',
            assigned_to: 'Jackson',
            escalation_reason: 'Manual escalation from MightyChat'
          },
          priority: 'urgent'
        });

      if (error) throw error;
      toast.success('Escalated to Jackson');
    } catch (err) {
      console.error('Escalate error:', err);
      toast.error('Failed to escalate');
    }
  };

  const handleOpenApproveFlow = () => {
    navigate(`/approveflow?contact_id=${contactId}`);
  };

  return (
    <div className="flex items-center gap-2 p-2 border-t bg-muted/30">
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleRouteToOpsDesk}
      >
        <Cog className="w-3 h-3 mr-1" />
        Route to Ops Desk
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleCreateTask}
      >
        <ListTodo className="w-3 h-3 mr-1" />
        Create Task
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleFlagCXRisk}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Flag CX Risk
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        onClick={handleEscalate}
      >
        <ArrowUpRight className="w-3 h-3 mr-1" />
        Escalate
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        onClick={handleOpenApproveFlow}
      >
        <Palette className="w-3 h-3 mr-1" />
        ApproveFlow
      </Button>
    </div>
  );
}
