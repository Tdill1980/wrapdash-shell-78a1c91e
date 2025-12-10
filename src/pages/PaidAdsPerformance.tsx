import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaidAdsPerformance } from "@/hooks/usePaidAdsPerformance";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  MousePointer,
  Eye,
  Target,
  ShoppingCart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PLACEMENT_COLORS = ["#405DE6", "#833AB4", "#E1306C", "#F77737", "#50D0B7"];

export default function PaidAdsPerformance() {
  const [dateRange, setDateRange] = useState("30");
  const { records, totals, topPerformers, byPlacement, isLoading, refetch } = usePaidAdsPerformance();

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Transform byPlacement for charts
  const placementData = Object.entries(byPlacement).map(([placement, data]) => ({
    placement: placement.replace("_", " ").toUpperCase(),
    ...data,
    cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    costPerConversion: data.conversions > 0 ? data.spend / data.conversions : 0,
  }));

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            <span className="bg-gradient-to-r from-[#405DE6] to-[#E1306C] bg-clip-text text-transparent">
              Paid Ads Performance
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track CPC, conversions, ad spend, AOV, and ROAS across all campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Primary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Impressions"
          value={formatNumber(totals.impressions)}
          icon={<Eye className="w-4 h-4" />}
          color="text-blue-500"
        />
        <MetricCard
          label="Clicks"
          value={formatNumber(totals.clicks)}
          icon={<MousePointer className="w-4 h-4" />}
          color="text-purple-500"
        />
        <MetricCard
          label="Ad Spend"
          value={formatCurrency(totals.spend)}
          icon={<DollarSign className="w-4 h-4" />}
          color="text-amber-500"
        />
        <MetricCard
          label="CPC"
          value={`$${totals.cpc.toFixed(2)}`}
          icon={<MousePointer className="w-4 h-4" />}
          color="text-cyan-500"
          subtitle="Cost Per Click"
        />
        <MetricCard
          label="Conversions"
          value={formatNumber(totals.conversions)}
          icon={<Target className="w-4 h-4" />}
          color="text-green-500"
        />
        <MetricCard
          label="AOV"
          value={formatCurrency(totals.aov)}
          icon={<ShoppingCart className="w-4 h-4" />}
          color="text-pink-500"
          subtitle="Avg Order Value"
        />
      </div>

      {/* KPI Highlight Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">CTR</div>
            <div className="text-3xl font-bold mt-1">{totals.ctr.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Industry avg: 1.0%</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Conversion Rate</div>
            <div className="text-3xl font-bold mt-1">{totals.conversionRate.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Goal: 2.0%</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Cost Per Conversion</div>
            <div className="text-3xl font-bold mt-1 text-amber-500">
              {formatCurrency(totals.costPerConversion)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Target: &lt;$50</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">ROAS</div>
            <div className={`text-3xl font-bold mt-1 ${totals.roas >= 1 ? "text-green-500" : "text-red-500"}`}>
              {totals.roas.toFixed(2)}x
            </div>
            <div className="text-xs text-muted-foreground mt-1">Break-even: 1.0x</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spend vs Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Spend vs Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {records.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={records.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="id" tick={false} />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                    />
                    <Bar dataKey="spend" fill="#E1306C" name="Spend" />
                    <Bar dataKey="revenue" fill="#50D0B7" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data yet. Log ad performance from Ad Vault.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CPC by Placement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cost Per Conversion by Placement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {placementData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={placementData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="placement" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost/Conv"]}
                    />
                    <Bar dataKey="costPerConversion" fill="#F77737">
                      {placementData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PLACEMENT_COLORS[index % PLACEMENT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No placement data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Performing Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Ad</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Impressions</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Clicks</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">CPC</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Conv</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Cost/Conv</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">AOV</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Ad Spend</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Revenue</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.length > 0 ? (
                  topPerformers.map((ad) => (
                    <tr key={ad.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {ad.ad_vault?.png_url && (
                            <img
                              src={ad.ad_vault.png_url}
                              alt=""
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span className="truncate max-w-[150px]">
                            {ad.ad_vault?.headline || "Ad"}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 capitalize">{ad.ad_type}</td>
                      <td className="text-right py-3 px-2">{formatNumber(ad.impressions)}</td>
                      <td className="text-right py-3 px-2">{formatNumber(ad.clicks)}</td>
                      <td className="text-right py-3 px-2">${Number(ad.cpc).toFixed(2)}</td>
                      <td className="text-right py-3 px-2">{ad.conversions}</td>
                      <td className="text-right py-3 px-2 text-amber-500">
                        ${Number(ad.cost_per_conversion).toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2">${Number(ad.aov).toFixed(2)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(Number(ad.spend))}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(Number(ad.revenue))}</td>
                      <td className="text-right py-3 px-2">
                        <span className={Number(ad.roas) >= 1 ? "text-green-500" : "text-red-500"}>
                          {Number(ad.roas).toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-muted-foreground">
                      No ad performance data yet. Log metrics from Ad Vault to see your top performers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
          <span className={color}>{icon}</span>
          {label}
        </div>
        <div className="text-xl font-bold mt-1">{value}</div>
        {subtitle && <div className="text-[10px] text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
