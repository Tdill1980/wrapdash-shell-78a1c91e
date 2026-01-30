import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Users, Package, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConversationEvent } from "@/hooks/useConversationEvents";

interface EscalationTypeCount {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

export function EscalationsDashboardCard() {
  const navigate = useNavigate();

  // Fetch escalation events and group by subtype
  const { data: escalationData, isLoading } = useQuery({
    queryKey: ["dashboard-escalations-by-type"],
    queryFn: async () => {
      // Get escalation events with subtype
      const { data: events, error } = await supabase
        .from("conversation_events")
        .select("conversation_id, subtype, payload")
        .eq("event_type", "escalation_sent")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Count unique conversations by subtype
      const typeMap: Record<string, Set<string>> = {};
      
      (events || []).forEach((event) => {
        const subtype = event.subtype || 'general';
        if (!typeMap[subtype]) {
          typeMap[subtype] = new Set();
        }
        typeMap[subtype].add(event.conversation_id);
      });

      // Convert to counts with labels
      const typeCounts: EscalationTypeCount[] = [];
      
      const subtypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
        'bulk': { label: 'Bulk Orders', icon: Package, color: 'text-purple-500' },
        'order_question': { label: 'Order Questions', icon: FileText, color: 'text-blue-500' },
        'quote_request': { label: 'Quote Requests', icon: FileText, color: 'text-green-500' },
        'pricing': { label: 'Pricing Help', icon: FileText, color: 'text-amber-500' },
        'design': { label: 'Design Review', icon: FileText, color: 'text-pink-500' },
        'general': { label: 'Escalation Messages', icon: Users, color: 'text-cyan-500' },
      };

      Object.entries(typeMap).forEach(([subtype, conversationIds]) => {
        const config = subtypeLabels[subtype] || subtypeLabels['general'];
        typeCounts.push({
          label: config.label,
          count: conversationIds.size,
          icon: config.icon,
          color: config.color,
        });
      });

      // Sort by count descending
      typeCounts.sort((a, b) => b.count - a.count);

      const totalActive = Object.values(typeMap).reduce((sum, set) => sum + set.size, 0);

      return { typeCounts, totalActive };
    },
    refetchInterval: 30000,
  });

  const displayTypes = escalationData?.typeCounts.slice(0, 3) || [];
  const totalActive = escalationData?.totalActive || 0;

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Escalations</span>
            {totalActive > 0 && (
              <span className="text-xs bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded-full font-semibold">
                {totalActive}
              </span>
            )}
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
        {/* Type Breakdown */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-background/50 rounded animate-pulse" />
            ))}
          </div>
        ) : displayTypes.length > 0 ? (
          <div className="space-y-2">
            {displayTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => navigate("/escalations")}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${type.color}`} />
                    <span className="text-sm text-foreground">{type.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${type.color}`}>
                    {type.count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No active escalations</p>
          </div>
        )}

        {/* CTA Banner */}
        <div
          className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 cursor-pointer hover:bg-orange-500/20 transition-colors"
          onClick={() => navigate("/escalations")}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">Review Queue</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
