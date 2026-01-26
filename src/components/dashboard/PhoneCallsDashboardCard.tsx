import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Flame, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function PhoneCallsDashboardCard({ className }: { className?: string }) {
  const navigate = useNavigate();

  // Fetch phone call stats
  const { data: phoneStats } = useQuery({
    queryKey: ["phone-calls-dashboard-stats"],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [totalResult, hotLeadsResult, pendingResult] = await Promise.all([
        // Total calls in last 24h
        supabase
          .from("phone_calls")
          .select("id", { count: "exact", head: true })
          .gte("created_at", twentyFourHoursAgo),
        
        // Hot leads
        supabase
          .from("phone_calls")
          .select("id", { count: "exact", head: true })
          .eq("is_hot_lead", true)
          .gte("created_at", twentyFourHoursAgo),
        
        // Pending (needs response)
        supabase
          .from("phone_calls")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .eq("sms_sent", false)
          .gte("created_at", twentyFourHoursAgo),
      ]);

      return {
        totalCalls: totalResult.count || 0,
        hotLeads: hotLeadsResult.count || 0,
        pending: pendingResult.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  // Fetch recent calls
  const { data: recentCalls } = useQuery({
    queryKey: ["phone-calls-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("phone_calls")
        .select("id, caller_phone, customer_name, is_hot_lead, status, created_at, ai_classification")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const totalCalls = phoneStats?.totalCalls || 0;
  const hotLeads = phoneStats?.hotLeads || 0;

  return (
    <Card className={`border-border bg-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-500" />
            Phone Calls
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/mightychat-v2?filter=phone")}
            className="text-xs h-7 px-2"
          >
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-background/50 text-center">
            <span className="text-lg font-semibold text-foreground">{totalCalls}</span>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </div>
          <div 
            className="p-2.5 rounded-lg bg-background/50 text-center cursor-pointer hover:bg-background/80 transition-colors"
            onClick={() => navigate("/mightychat-v2?filter=phone&hot=true")}
          >
            {hotLeads > 0 ? (
              <Badge className="bg-red-500 text-white animate-pulse flex items-center justify-center gap-1 mb-1">
                <Flame className="w-3 h-3" />
                {hotLeads}
              </Badge>
            ) : (
              <span className="text-lg font-semibold text-foreground">0</span>
            )}
            <p className="text-[10px] text-muted-foreground">Hot Leads</p>
          </div>
          <div className="p-2.5 rounded-lg bg-background/50 text-center">
            <span className="text-lg font-semibold text-amber-500">{phoneStats?.pending || 0}</span>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Recent Calls */}
        {recentCalls && recentCalls.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Recent Calls
            </p>
            {recentCalls.map((call) => {
              const classification = call.ai_classification as { intent?: string; summary?: string } | null;
              return (
                <div 
                  key={call.id}
                  className="flex items-center justify-between p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/mightychat-v2?filter=phone&id=${call.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400">
                      <Phone className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {call.customer_name || formatPhoneNumber(call.caller_phone)}
                      </p>
                      {classification?.intent && (
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {classification.intent.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {call.is_hot_lead && (
                      <Flame className="w-3 h-3 text-red-500" />
                    )}
                    {call.status === "completed" && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {(!recentCalls || recentCalls.length === 0) && (
          <div className="text-center py-4">
            <Phone className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No calls yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
