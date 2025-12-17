import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";

const MONTHLY_TARGET = 400000;
const DAILY_TARGET = 10000;

interface SalesGoalData {
  currentRevenue: number;
  orderCount: number;
  daysRemaining: number;
  daysElapsed: number;
  dailyPaceRequired: number;
  percentComplete: number;
  status: "ON_TRACK" | "BEHIND" | "CRITICAL" | "AHEAD";
  todayRevenue: number;
}

export function SalesGoalTracker() {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["sales-goal-data"],
    queryFn: async (): Promise<SalesGoalData> => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get all orders for this month
      const { data: orders, error } = await supabase
        .from("shopflow_orders")
        .select("order_total, created_at")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      if (error) throw error;

      const currentRevenue = orders?.reduce((sum, o) => sum + (o.order_total || 0), 0) || 0;
      const orderCount = orders?.length || 0;
      
      // Today's revenue
      const todayOrders = orders?.filter(o => new Date(o.created_at) >= todayStart) || [];
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.order_total || 0), 0);
      
      const daysElapsed = differenceInDays(now, monthStart) + 1;
      const daysRemaining = differenceInDays(monthEnd, now);
      const remainingTarget = MONTHLY_TARGET - currentRevenue;
      const dailyPaceRequired = daysRemaining > 0 ? remainingTarget / daysRemaining : 0;
      const percentComplete = (currentRevenue / MONTHLY_TARGET) * 100;
      
      // Expected progress based on days elapsed
      const expectedPercent = (daysElapsed / differenceInDays(monthEnd, monthStart)) * 100;
      const progressDiff = percentComplete - expectedPercent;
      
      let status: SalesGoalData["status"];
      if (percentComplete >= 100) {
        status = "AHEAD";
      } else if (progressDiff >= 5) {
        status = "AHEAD";
      } else if (progressDiff >= -10) {
        status = "ON_TRACK";
      } else if (progressDiff >= -25) {
        status = "BEHIND";
      } else {
        status = "CRITICAL";
      }

      return {
        currentRevenue,
        orderCount,
        daysRemaining,
        daysElapsed,
        dailyPaceRequired,
        percentComplete,
        status,
        todayRevenue,
      };
    },
    refetchInterval: 60000, // Refresh every minute
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
      progressColor: "bg-green-500",
    },
    ON_TRACK: {
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: TrendingUp,
      label: "On Track",
      progressColor: "bg-blue-500",
    },
    BEHIND: {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: TrendingDown,
      label: "Behind Pace",
      progressColor: "bg-yellow-500",
    },
    CRITICAL: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: AlertTriangle,
      label: "Critical",
      progressColor: "bg-red-500",
    },
  };

  const config = statusConfig[salesData.status];
  const StatusIcon = config.icon;

  return (
    <Card className="dashboard-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="dashboard-card-title flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span>Sales Goal Tracker</span>
          </CardTitle>
          <Badge variant="outline" className={config.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Goal</span>
            <span className="font-semibold">
              ${salesData.currentRevenue.toLocaleString()} / ${MONTHLY_TARGET.toLocaleString()}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Today's Revenue */}
          <div className="bg-background/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              Today's Revenue
            </div>
            <div className="text-lg font-bold">
              ${salesData.todayRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Goal: ${DAILY_TARGET.toLocaleString()}/day
            </div>
          </div>

          {/* Required Daily Pace */}
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

        {/* Alert for Critical Status */}
        {salesData.status === "CRITICAL" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              Action Required
            </div>
            <p className="text-xs text-red-300/80">
              Revenue is significantly behind pace. Need ${Math.round(salesData.dailyPaceRequired).toLocaleString()}/day 
              for the next {salesData.daysRemaining} days to hit the monthly goal.
            </p>
          </div>
        )}

        {/* Orders count */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          {salesData.orderCount} orders this month • Updated {format(new Date(), "h:mm a")}
        </div>
      </CardContent>
    </Card>
  );
}