import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Palette, 
  MessageCircle, 
  Cog, 
  User,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TalkToAgentActionsProps {
  conversationId: string;
  contactId: string | null;
  channel: string;
  customerName?: string;
  subject?: string;
  className?: string;
}

const AGENT_ROUTES = [
  {
    id: "alex",
    name: "Alex Morgan",
    label: "Route to Alex",
    description: "Quote follow-up",
    icon: Mail,
    color: "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    actionType: "route_to_quotes",
    stream: "quotes",
  },
  {
    id: "grant",
    name: "Grant Miller",
    label: "Route to Grant",
    description: "Design review",
    icon: Palette,
    color: "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30",
    actionType: "route_to_design",
    stream: "design",
  },
  {
    id: "casey",
    name: "Casey Ramirez",
    label: "Ask Casey",
    description: "Social engagement",
    icon: MessageCircle,
    color: "text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30",
    actionType: "route_to_social",
    stream: "dms",
  },
  {
    id: "ops",
    name: "Ops Desk",
    label: "Flag Ops Desk",
    description: "Needs approval",
    icon: Cog,
    color: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30",
    actionType: "flag_ops_desk",
    stream: "ops",
    priority: "urgent",
  },
];

export function TalkToAgentActions({
  conversationId,
  contactId,
  channel,
  customerName,
  subject,
  className,
}: TalkToAgentActionsProps) {
  
  const handleRouteToAgent = async (agent: typeof AGENT_ROUTES[0]) => {
    try {
      const { error } = await supabase
        .from('ai_actions')
        .insert({
          action_type: agent.actionType,
          action_payload: {
            conversation_id: conversationId,
            contact_id: contactId,
            channel,
            customer_name: customerName || 'Unknown',
            subject: subject || 'Conversation',
            requested_by: 'MightyChat Quick Action',
            assigned_to: agent.name,
            revenue_impact: agent.id === 'alex' ? 'high' : 'medium',
          },
          priority: agent.priority || 'normal',
          resolved: false,
        });

      if (error) throw error;

      // Update conversation assignment
      await supabase
        .from('conversations')
        .update({ 
          assigned_to: agent.name,
          recipient_inbox: agent.stream,
        })
        .eq('id', conversationId);

      toast.success(`Routed to ${agent.name}`, {
        description: `${agent.description} task created`,
      });
    } catch (err) {
      console.error('Route to agent error:', err);
      toast.error(`Failed to route to ${agent.name}`);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Talk to Agent
        </span>
      </div>
      
      <div className="space-y-1.5">
        {AGENT_ROUTES.map((agent) => (
          <Button
            key={agent.id}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-xs h-auto py-2 px-3",
              agent.color
            )}
            onClick={() => handleRouteToAgent(agent)}
          >
            <agent.icon className="w-4 h-4 mr-2 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="font-medium">{agent.label}</div>
              <div className="text-[10px] text-muted-foreground">{agent.description}</div>
            </div>
            <ArrowRight className="w-3 h-3 opacity-50" />
          </Button>
        ))}
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center mt-3 italic">
        Click = route with full context attached
      </p>
    </div>
  );
}
