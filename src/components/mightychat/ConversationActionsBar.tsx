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
  Forward,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface ConversationActionsBarProps {
  conversationId: string;
  contactId: string | null;
  channel: string;
  customerName?: string;
  customerEmail?: string;
  latestMessage?: {
    id: string;
    content: string;
    created_at: string | null;
  } | null;
}

// Email map for team members
const TEAM_EMAILS = {
  Jackson: "jackson@weprintwraps.com",
  Lance: "lance@weprintwraps.com",
};

export function ConversationActionsBar({
  conversationId,
  contactId,
  channel,
  customerName,
  customerEmail,
  latestMessage,
}: ConversationActionsBarProps) {
  const navigate = useNavigate();
  const [sendingEmail, setSendingEmail] = useState(false);

  // Send email notification to team member
  const sendNotificationEmail = async (
    type: "backlog" | "escalation" | "cx_risk" | "design_forward" | "add_to_order",
    assignedTo: "Jackson" | "Lance",
    additionalContext?: string
  ) => {
    try {
      const typeLabels = {
        backlog: "BACKLOG",
        escalation: "ESCALATION - URGENT",
        cx_risk: "CX RISK - URGENT",
        design_forward: "DESIGN FILES",
        add_to_order: "ADD TO ORDER",
      };

      const { data, error } = await lovableFunctions.functions.invoke("forward-to-team", {
        body: {
          conversation_id: conversationId,
          to_email: TEAM_EMAILS[assignedTo],
          subject: `[${typeLabels[type]}] ${customerName || "Customer"} - Action Required`,
          reason: additionalContext || `${typeLabels[type]} from MightyChat`,
          sender_name: customerName,
          sender_email: customerEmail,
          original_message: latestMessage?.content,
          context: JSON.stringify({
            type,
            assigned_to: assignedTo,
            conversation_id: conversationId,
            channel,
          }),
        },
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Failed to send notification email:", err);
      return false;
    }
  };

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
          customer_email: customerEmail,
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

      // Send email notification
      const emailSent = await sendNotificationEmail("backlog", assignedTo);
      
      toast.success(
        emailSent 
          ? `Backlog created for ${assignedTo} - Email sent!` 
          : `Backlog created for ${assignedTo}`
      );
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
          customer_email: customerEmail,
          requested_by: "MightyChat",
          revenue_impact: "high",
          assigned_to: "Jackson",
          source_message_id: latestMessage?.id,
          source_message_excerpt: latestMessage?.content
            ? latestMessage.content.slice(0, 500)
            : null,
        },
        priority: "urgent",
      });

      if (error) throw error;

      // Also update conversation priority
      await supabase
        .from("conversations")
        .update({ priority: "urgent" })
        .eq("id", conversationId);

      // Send email notification to Jackson
      const emailSent = await sendNotificationEmail("cx_risk", "Jackson", "CX Risk flagged - requires immediate attention");

      toast.success(
        emailSent
          ? "CX Risk flagged - Jackson notified via email!"
          : "CX Risk flagged - Jackson notified"
      );
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
          customer_email: customerEmail,
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

      // Send email notification
      const emailSent = await sendNotificationEmail("escalation", assignedTo, "Escalated from MightyChat - requires urgent attention");

      toast.success(
        emailSent
          ? `Escalated to ${assignedTo} - Email sent!`
          : `Escalated to ${assignedTo}`
      );
    } catch (err) {
      console.error("Escalate error:", err);
      toast.error("Failed to escalate");
    }
  };

  const handleForwardToDesign = async () => {
    setSendingEmail(true);
    try {
      // Fetch any attachments from recent messages in this conversation
      const { data: messages } = await supabase
        .from("messages")
        .select("metadata")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(20);

      const attachmentUrls: string[] = [];
      messages?.forEach((msg) => {
        const meta = msg.metadata as Record<string, any> | null;
        if (meta?.attachments && Array.isArray(meta.attachments)) {
          attachmentUrls.push(...meta.attachments);
        }
        if (meta?.attachment_url) {
          attachmentUrls.push(meta.attachment_url);
        }
      });

      const { error } = await lovableFunctions.functions.invoke("forward-to-team", {
        body: {
          conversation_id: conversationId,
          to_email: TEAM_EMAILS.Lance,
          subject: `[DESIGN FILES] ${customerName || "Customer"} - Files Attached`,
          reason: "Design files forwarded from customer email",
          sender_name: customerName,
          sender_email: customerEmail,
          original_message: latestMessage?.content,
          attachment_urls: attachmentUrls,
        },
      });

      if (error) throw error;

      toast.success(`Forwarded to Lance with ${attachmentUrls.length} attachment(s)!`);
    } catch (err) {
      console.error("Forward to design error:", err);
      toast.error("Failed to forward to design team");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAddToOrder = async (assignedTo: "Jackson" | "Lance") => {
    try {
      const { error } = await supabase.from("ai_actions").insert({
        action_type: "create_task",
        action_payload: {
          conversation_id: conversationId,
          contact_id: contactId,
          channel,
          customer_name: customerName,
          customer_email: customerEmail,
          task_type: "add_to_order",
          requested_by: "MightyChat",
          revenue_impact: "medium",
          assigned_to: assignedTo,
          source_message_id: latestMessage?.id,
          source_message_excerpt: latestMessage?.content
            ? latestMessage.content.slice(0, 500)
            : null,
          notes: "Customer wants to add items to their order",
        },
        priority: "normal",
      });

      if (error) throw error;

      // Send email notification
      const emailSent = await sendNotificationEmail("add_to_order", assignedTo, "Customer wants to add items to their order");

      toast.success(
        emailSent
          ? `"Add to Order" task created for ${assignedTo} - Email sent!`
          : `"Add to Order" task created for ${assignedTo}`
      );
    } catch (err) {
      console.error("Add to order error:", err);
      toast.error("Failed to create add-to-order task");
    }
  };

  const handleOpenApproveFlow = () => {
    navigate(`/approveflow?contact_id=${contactId}`);
  };

  return (
    <div className="flex items-center gap-2 p-2 border-t bg-muted/30 flex-wrap">
      {/* Forward to Design - Direct email button */}
      <Button
        variant="outline"
        size="sm"
        className="text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
        onClick={handleForwardToDesign}
        disabled={sendingEmail}
      >
        <Forward className="w-3 h-3 mr-1" />
        {sendingEmail ? "Sending..." : "Forward to Lance"}
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
            Backlog to Lance (emails lance@weprintwraps.com)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => createBacklog("Jackson")}>
            Backlog to Jackson (emails jackson@weprintwraps.com)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add to Order dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs border-green-500/50 text-green-400 hover:bg-green-500/10">
            <Plus className="w-3 h-3 mr-1" />
            Add to Order
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleAddToOrder("Jackson")}>
            Assign to Jackson (emails)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToOrder("Lance")}>
            Assign to Lance (emails)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="text-xs border-red-500/50 text-red-400 hover:bg-red-500/10"
        onClick={handleFlagCXRisk}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Flag CX Risk
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Escalate
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => escalateTo("Lance")}>
            Escalate to Lance (emails)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => escalateTo("Jackson")}>
            Escalate to Jackson (emails)
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
