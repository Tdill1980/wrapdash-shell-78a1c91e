import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Clock, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { evaluateEscalationStatus } from "@/hooks/useEscalationStatus";
import type { ConversationEvent } from "@/hooks/useConversationEvents";

export function EscalationsDashboardCard() {
  const navigate = useNavigate();

  // Fetch escalation events and compute status counts
  const { data: escalationData, isLoading } = useQuery({
    queryKey: ["dashboard-escalations"],
    queryFn: async () => {
      // Get all escalation events
      const { data: events, error } = await supabase
        .from("conversation_events")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group events by conversation_id
      const eventsByConversation: Record<string, ConversationEvent[]> = {};
      (events || []).forEach((event) => {
        const convId = event.conversation_id;
        if (!eventsByConversation[convId]) {
          eventsByConversation[convId] = [];
        }
        eventsByConversation[convId].push(event as ConversationEvent);
      });

      // Evaluate each conversation's escalation status
      let activeCount = 0;
      let blockedCount = 0;
      let pendingCount = 0;

      Object.values(eventsByConversation).forEach((convEvents) => {
        const status = evaluateEscalationStatus(convEvents);
        if (status.hasEscalation) {
          if (status.status === "blocked") {
            blockedCount++;
          } else if (status.status === "open") {
            pendingCount++;
          }
          if (status.status !== "complete") {
            activeCount++;
          }
        }
      });

      return { activeCount, blockedCount, pendingCount };
    },
    refetchInterval: 30000,
  });

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Escalations</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/escalations")}
            className="text-xs h-7 px-2"
          >
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Active */}
          <div className="bg-orange-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500">
              {isLoading ? "..." : escalationData?.activeCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>

          {/* Blocked */}
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">
              {isLoading ? "..." : escalationData?.blockedCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Blocked</p>
          </div>
        </div>

        {/* CTA Banner */}
        <div
          className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 cursor-pointer hover:bg-orange-500/20 transition-colors"
          onClick={() => navigate("/escalations")}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">Review Escalations</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          Escalated conversations requiring human review
        </p>
      </CardContent>
    </Card>
  );
}
