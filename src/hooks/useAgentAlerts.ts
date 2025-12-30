import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AgentAlert {
  id: string;
  agent_id: string;
  alert_type: string;
  order_id: string | null;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  conversation_id: string | null;
  message_excerpt: string | null;
  email_sent_to: string[] | null;
  email_sent_at: string | null;
  task_id: string | null;
  task_status: string;
  priority: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useAgentAlerts(limit = 50) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ["agent-alerts", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching agent alerts:", error);
        throw error;
      }

      return data as AgentAlert[];
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ 
      alertId, 
      resolvedBy, 
      notes 
    }: { 
      alertId: string; 
      resolvedBy: string; 
      notes?: string 
    }) => {
      const { error } = await supabase
        .from("agent_alerts")
        .update({
          task_status: "resolved",
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null,
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-alerts"] });
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved.",
      });
    },
    onError: (error) => {
      console.error("Error resolving alert:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resolve alert.",
      });
    },
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async ({ alertId }: { alertId: string }) => {
      const { error } = await supabase
        .from("agent_alerts")
        .update({
          task_status: "acknowledged",
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-alerts"] });
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged.",
      });
    },
    onError: (error) => {
      console.error("Error acknowledging alert:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to acknowledge alert.",
      });
    },
  });

  // Get alert counts by type
  const alertCounts = alerts.reduce((acc, alert) => {
    acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pendingAlerts = alerts.filter(a => a.task_status === "pending");
  const acknowledgedAlerts = alerts.filter(a => a.task_status === "acknowledged");
  const resolvedAlerts = alerts.filter(a => a.task_status === "resolved");

  return {
    alerts,
    isLoading,
    refetch,
    resolveAlert,
    acknowledgeAlert,
    alertCounts,
    pendingAlerts,
    acknowledgedAlerts,
    resolvedAlerts,
    pendingCount: pendingAlerts.length,
  };
}

export function useAgentAlertStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["agent-alert-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get counts for today
      const { count: totalToday } = await supabase
        .from("agent_alerts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      const { count: pendingCount } = await supabase
        .from("agent_alerts")
        .select("*", { count: "exact", head: true })
        .eq("task_status", "pending");

      const { count: resolvedToday } = await supabase
        .from("agent_alerts")
        .select("*", { count: "exact", head: true })
        .eq("task_status", "resolved")
        .gte("resolved_at", today.toISOString());

      // Get counts by type
      const { data: typeData } = await supabase
        .from("agent_alerts")
        .select("alert_type")
        .eq("task_status", "pending");

      const typeCounts = (typeData || []).reduce((acc, row) => {
        acc[row.alert_type] = (acc[row.alert_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalToday: totalToday || 0,
        pendingCount: pendingCount || 0,
        resolvedToday: resolvedToday || 0,
        typeCounts,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return { stats, isLoading };
}
