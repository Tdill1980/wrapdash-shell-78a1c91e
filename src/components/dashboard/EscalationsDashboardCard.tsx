import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Package, Phone, Frown, Palette } from "lucide-react";
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

      // Consolidation map - multiple DB subtypes → single display category
      const consolidationMap: Record<string, string> = {
        'bulk_inquiry': 'bulk',
        'bulk_inquiry_with_email': 'bulk',
        'jackson': 'sales',
        'quality_issue': 'unhappy',
        'unhappy_customer': 'unhappy',
        'design': 'design',
        'design_file': 'design',
      };

      // Count unique conversations by consolidated category
      const typeMap: Record<string, Set<string>> = {};
      
      (events || []).forEach((event) => {
        const rawSubtype = event.subtype || 'general';
        // Skip 'lance' - those are standard quotes handled in MightyChat hot leads
        if (rawSubtype === 'lance') return;
        
        const consolidatedType = consolidationMap[rawSubtype] || 'general';
        if (!typeMap[consolidatedType]) {
          typeMap[consolidatedType] = new Set();
        }
        typeMap[consolidatedType].add(event.conversation_id);
      });

      // Display labels for consolidated categories
      const subtypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
        'bulk': { label: 'Bulk Quote', icon: Package, color: 'text-purple-500' },
        'sales': { label: 'Sales Escalation', icon: Phone, color: 'text-blue-500' },
        'unhappy': { label: 'Unhappy Customer', icon: Frown, color: 'text-orange-500' },
        'design': { label: 'Design Review', icon: Palette, color: 'text-pink-500' },
        'general': { label: 'Other Escalation', icon: AlertTriangle, color: 'text-cyan-500' },
      };

      // Convert to counts with labels
      const typeCounts: EscalationTypeCount[] = [];

      Object.entries(typeMap).forEach(([category, conversationIds]) => {
        const config = subtypeLabels[category] || subtypeLabels['general'];
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
