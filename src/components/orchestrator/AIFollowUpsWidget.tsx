import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  MessageSquare, 
  Send, 
  Loader2, 
  RefreshCw,
  User,
  Car
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface AIAction {
  id: string;
  action_type: string;
  action_payload: any;
  priority: string;
  created_at: string;
  resolved: boolean;
}

export const AIFollowUpsWidget = () => {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Fetch pending follow-up actions
  const { data: followUps, isLoading, refetch } = useQuery({
    queryKey: ["ai-followups", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("ai_actions")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("resolved", false)
        .in("action_type", ["followup", "design_ready", "quote_created"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as AIAction[];
    },
    enabled: !!organizationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Send follow-up mutation
  const sendFollowUp = useMutation({
    mutationFn: async (action: AIAction) => {
      const { data, error } = await supabase.functions.invoke("ai-followup-engine", {
        body: {
          organization_id: organizationId,
          trigger_type: "manual",
          context: action.action_payload,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, action) => {
      // Mark action as resolved
      await supabase
        .from("ai_actions")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", action.id);

      toast.success("Follow-up sent!");
      queryClient.invalidateQueries({ queryKey: ["ai-followups"] });
    },
    onError: (error) => {
      console.error("Follow-up error:", error);
      toast.error("Failed to send follow-up");
    },
  });

  const handleSendFollowUp = async (action: AIAction) => {
    setSendingId(action.id);
    try {
      await sendFollowUp.mutateAsync(action);
    } finally {
      setSendingId(null);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "followup":
        return <Clock className="w-4 h-4" />;
      case "design_ready":
        return <Car className="w-4 h-4" />;
      case "quote_created":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "followup":
        return "Follow-up";
      case "design_ready":
        return "Design Ready";
      case "quote_created":
        return "Quote Sent";
      default:
        return "Action";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            AI Follow-Ups
            {followUps && followUps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {followUps.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!followUps || followUps.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending follow-ups</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {followUps.map((action) => (
                <div
                  key={action.id}
                  className="p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(action.action_type)}
                      <Badge variant="outline" className={getPriorityColor(action.priority)}>
                        {getActionLabel(action.action_type)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {action.action_payload?.customer_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span>{action.action_payload.customer_name}</span>
                      </div>
                    )}
                    {action.action_payload?.vehicle && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Car className="w-3 h-3" />
                        <span>{action.action_payload.vehicle}</span>
                      </div>
                    )}
                    {action.action_payload?.message && (
                      <p className="text-xs text-muted-foreground italic mt-2">
                        "{action.action_payload.message.substring(0, 80)}..."
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-1"
                      onClick={() => handleSendFollowUp(action)}
                      disabled={sendingId === action.id}
                    >
                      {sendingId === action.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Send Now
                    </Button>
                    {action.action_payload?.conversation_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/mightychat")}
                      >
                        <MessageSquare className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};