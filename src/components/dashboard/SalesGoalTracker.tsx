import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface SalesGoalData {
  currentRevenue: number;
  orderCount: number;
  daysRemaining: number;
  daysElapsed: number;
  dailyPaceRequired: number;
  percentComplete: number;
  status: "ON_TRACK" | "BEHIND" | "CRITICAL" | "AHEAD";
  todayRevenue: number;
  monthlyTarget: number;
  dailyTarget: number;
  lastYearRevenue: number;
  lastYearOrderCount: number;
  yoyDifference: number;
  yoyPercentChange: number;
  suggestions: string[];
  dataSource: string;
  lastUpdated: string;
}

export function SalesGoalTracker() {
  const { data: salesData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["sales-goal-data-woocommerce"],
    queryFn: async (): Promise<SalesGoalData> => {
      const { data, error } = await supabase.functions.invoke("sync-woocommerce-sales");
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as SalesGoalData;
    },
    refetchInterval: 300000,
    staleTime: 60000,
  });

  if (isLoading || !salesData) {
    return (
      <Card className="dashboard-card animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    AHEAD: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: TrendingUp,
      label: "Ahead of Goal",
    },
    ON_TRACK: {
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: TrendingUp,
      label: "On Track",
    },
    BEHIND: {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: TrendingDown,
      label: "Behind Pace",
    },
    CRITICAL: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: AlertTriangle,
      label: "Critical",
    },
  };

  const config = statusConfig[salesData.status];
  const StatusIcon = config.icon;
  const MONTHLY_TARGET = salesData.monthlyTarget || 400000;
  const DAILY_TARGET = salesData.dailyTarget || 10000;

  return (
    <Card className="dashboard-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="dashboard-card-title flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span>Sales Goal Tracker</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant="outline" className={config.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Goal</span>
            <span className="font-semibold">
              ${salesData.currentRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${MONTHLY_TARGET.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min(salesData.percentComplete, 100)} 
              className="h-3"
            />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-white/50"
              style={{ left: `${(salesData.daysElapsed / 30) * 100}%` }}
              title="Expected progress"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{salesData.percentComplete.toFixed(1)}% complete</span>
            <span>{salesData.daysRemaining} days remaining</span>
          </div>
        </div>

        {/* Year-over-Year Comparison */}
        {salesData.lastYearRevenue != null && (
          <div className={`rounded-lg p-3 border ${(salesData.yoyDifference ?? 0) >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">vs. Last Year (Same Period)</span>
              <span className={`text-sm font-bold ${(salesData.yoyDifference ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(salesData.yoyDifference ?? 0) >= 0 ? '+' : ''}${Math.round(salesData.yoyDifference ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                Last year: ${salesData.lastYearRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className={`text-xs ${(salesData.yoyPercentChange ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(salesData.yoyPercentChange ?? 0) >= 0 ? '+' : ''}{(salesData.yoyPercentChange ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              Today's Revenue
            </div>
            <div className="text-lg font-bold">
              ${salesData.todayRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">
              Goal: ${DAILY_TARGET.toLocaleString()}/day
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Daily Pace Required
            </div>
            <div className={`text-lg font-bold ${salesData.dailyPaceRequired > DAILY_TARGET * 1.5 ? 'text-red-400' : salesData.dailyPaceRequired > DAILY_TARGET ? 'text-yellow-400' : 'text-green-400'}`}>
              ${Math.round(salesData.dailyPaceRequired).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              To hit ${MONTHLY_TARGET.toLocaleString()}
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        {salesData.suggestions && salesData.suggestions.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              AI Recovery Suggestions
            </div>
            <ul className="text-xs text-amber-300/80 space-y-1">
              {salesData.suggestions.slice(0, 3).map((suggestion, i) => (
                <li key={i}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Orders count */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          {salesData.orderCount} orders this month • Live from WooCommerce • {format(new Date(salesData.lastUpdated), "h:mm a")}
        </div>
      </CardContent>
    </Card>
  );
}
