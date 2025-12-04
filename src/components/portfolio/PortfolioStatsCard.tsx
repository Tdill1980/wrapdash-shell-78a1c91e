import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, DollarSign, TrendingUp, Calendar } from "lucide-react";

interface PortfolioStatsCardProps {
  stats: {
    totalJobs: number;
    totalRevenue: number;
    avgPrice: number;
    jobsThisMonth: number;
    completedJobs: number;
    pendingJobs: number;
    topTags: { tag: string; count: number }[];
  };
}

export function PortfolioStatsCard({ stats }: PortfolioStatsCardProps) {
  const statItems = [
    {
      label: "Total Jobs",
      value: stats.totalJobs.toString(),
      icon: Briefcase,
      color: "text-blue-500"
    },
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      label: "Avg. Job Price",
      value: `$${Math.round(stats.avgPrice).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-purple-500"
    },
    {
      label: "This Month",
      value: stats.jobsThisMonth.toString(),
      icon: Calendar,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map(item => (
          <Card key={item.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Job Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold text-green-500">{stats.completedJobs}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-500">{stats.pendingJobs}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topTags.slice(0, 5).map(({ tag, count }) => (
                <div key={tag} className="flex items-center justify-between">
                  <span className="text-sm">{tag}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${Math.min(count * 20, 100)}px` }} />
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
