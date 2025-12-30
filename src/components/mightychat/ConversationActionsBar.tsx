import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  ListTodo,
  AlertTriangle,
  ArrowUpRight,
  Palette,
  Cog,
  Inbox,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationActionsBarProps {
  conversationId: string;
  contactId: string | null;
  channel: string;
  customerName?: string;
  latestMessage?: {
    id: string;
    content: string;
    created_at: string | null;
  } | null;
}

export function ConversationActionsBar({
  conversationId,
  contactId,
  channel,
  customerName,
  latestMessage,
}: ConversationActionsBarProps) {
  const navigate = useNavigate();

  const handleRouteToOpsDesk = async () => {
    try {
      const { error } = await supabase.from("ai_actions").insert({
        action_type: "conversation_review",
        action_payload: {
          conversation_id: conversationId,
          contact_id: contactId,
          channel,
          customer_name: customerName,
          requested_by: "MightyChat",
          revenue_impact: "medium",
          source_message_id: latestMessage?.id,
        },
        priority: "normal",
      });

      if (error) throw error;
      toast.success("Routed to Ops Desk");
    } catch (err) {
      console.error("Route to Ops Desk error:", err);
      toast.error("Failed to route to Ops Desk");
    }
  };

  const createBacklog = async (assignedTo: "Jackson" | "Lance") => {
    try {
      const { error } = await supabase.from("ai_actions").insert({
        action_type: "create_task",
        action_payload: {
          conversation_id: conversationId,
          contact_id: contactId,
          channel,
          customer_name: customerName,
          task_type: "follow_up",
          requested_by: "MightyChat",
          revenue_impact: "low",
          assigned_to: assignedTo,
          source_message_id: latestMessage?.id,
          source_message_excerpt: latestMessage?.content
            ? latestMessage.content.slice(0, 500)
            : null,
        },
        priority: "normal",
      });

      if (error) throw error;
      toast.success(`Backlog created for ${assignedTo}`);
    } catch (err) {
      console.error("Create task error:", err);
      toast.error("Failed to create backlog item");
    }
  };

  const handleFlagCXRisk = async () => {
    try {
      const { error } = await supabase.from("ai_actions").insert({
        action_type: "cx_risk_flag",
        action_payload: {
          conversation_id: conversationId,
          contact_id: contactId,
          channel,
          customer_name: customerName,
          requested_by: "MightyChat",
          revenue_impact: "high",
          assigned_to: "Jackson",
          source_message_id: latestMessage?.id,
        },
        priority: "urgent",
      });

      if (error) throw error;

      // Also update conversation priority
      await supabase
        .from("conversations")
        .update({ priority: "urgent" })
        .eq("id", conversationId);

      toast.success("CX Risk flagged - Jackson notified");
    } catch (err) {
      console.error("Flag CX Risk error:", err);
      toast.error("Failed to flag CX Risk");
    }
  };

  const escalateTo = async (assignedTo: "Jackson" | "Lance") => {
    try {
      const { error } = await supabase.from("ai_actions").insert({
        action_type: "escalation",
        action_payload: {
          conversation_id: conversationId,
          contact_id: contactId,
          channel,
          customer_name: customerName,
          requested_by: "MightyChat",
          revenue_impact: "high",
          assigned_to: assignedTo,
          escalation_reason: "Manual escalation from MightyChat",
          source_message_id: latestMessage?.id,
          source_message_excerpt: latestMessage?.content
            ? latestMessage.content.slice(0, 500)
            : null,
        },
        priority: "urgent",
      });

      if (error) throw error;
      toast.success(`Escalated to ${assignedTo}`);
    } catch (err) {
      console.error("Escalate error:", err);
      toast.error("Failed to escalate");
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            <Inbox className="w-3 h-3 mr-1" />
            Backlog
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => createBacklog("Lance")}>
            Backlog to Lance
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => createBacklog("Jackson")}>
            Backlog to Jackson
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleFlagCXRisk}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Flag CX Risk
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Escalate
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => escalateTo("Lance")}>
            Escalate to Lance
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => escalateTo("Jackson")}>
            Escalate to Jackson
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleRouteToOpsDesk}>
            Route to Ops Desk
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleOpenApproveFlow}
      >
        <Palette className="w-3 h-3 mr-1" />
        ApproveFlow
      </Button>
    </div>
  );
}
