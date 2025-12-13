import { Card, CardContent } from "@/components/ui/card";
import { PortfolioJob } from "@/hooks/usePortfolioJobs";
import { DollarSign, Briefcase, TrendingUp, PieChart } from "lucide-react";

interface PortfolioAnalyticsProps {
  jobs: PortfolioJob[];
}

export function PortfolioAnalytics({ jobs }: PortfolioAnalyticsProps) {
  // Calculate metrics
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "published").length;
  
  // Calculate jobs this month vs last month
  const now = new Date();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const thisYear = now.getFullYear();
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const jobsThisMonth = jobs.filter((j) => {
    const date = new Date(j.created_at || "");
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;

  const jobsLastMonth = jobs.filter((j) => {
    const date = new Date(j.created_at || "");
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  }).length;

  const monthGrowth = jobsLastMonth > 0 
    ? Math.round(((jobsThisMonth - jobsLastMonth) / jobsLastMonth) * 100) 
    : jobsThisMonth > 0 ? 100 : 0;

  // Group by vehicle make for breakdown
  const byMake = jobs.reduce((acc, job) => {
    const make = job.vehicle_make || "Other";
    acc[make] = (acc[make] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMakes = Object.entries(byMake)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Jobs */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <div className="text-xs text-muted-foreground">Total Jobs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedJobs}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Month */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{jobsThisMonth}</span>
                {monthGrowth !== 0 && (
                  <span className={`text-xs ${monthGrowth > 0 ? "text-green-500" : "text-red-500"}`}>
                    {monthGrowth > 0 ? "+" : ""}{monthGrowth}%
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Makes */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <PieChart className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Top Makes</div>
              <div className="text-xs text-muted-foreground truncate">
                {topMakes.length > 0
                  ? topMakes.map(([make, count]) => `${make} (${count})`).join(", ")
                  : "No data yet"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
