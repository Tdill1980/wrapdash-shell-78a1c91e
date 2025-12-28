import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Users, Target, Zap, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";

type Stats = {
  totals: {
    total_quotes: number;
    total_converted: number;
  };
  by_source: Record<string, number>;
  conversion_by_source: Record<string, number>;
  retargeting: {
    quotes_with_followups: number;
    converted_after_followup: number;
  };
};

type RangePreset = "7d" | "30d" | "all" | "custom";

export default function QuoteStatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    loadStats();
  }, [preset, startDate, endDate]);

  async function loadStats() {
    setLoading(true);

    let start: string | null = null;
    let end: string | null = null;

    const now = new Date();

    if (preset === "7d") {
      start = new Date(now.getTime() - 7 * 86400000).toISOString();
    } else if (preset === "30d") {
      start = new Date(now.getTime() - 30 * 86400000).toISOString();
    } else if (preset === "custom") {
      start = startDate ? new Date(startDate).toISOString() : null;
      end = endDate ? new Date(endDate).toISOString() : null;
    }
    // "all" leaves both as null

    const { data, error } = await supabase.rpc("get_quote_stats", {
      start_date: start,
      end_date: end,
    });

    if (!error && data) {
      setStats(data as Stats);
    }
    setLoading(false);
  }

  const conversionRate = stats?.totals 
    ? ((stats.totals.total_converted / Math.max(stats.totals.total_quotes, 1)) * 100).toFixed(1)
    : "0";

  const retargetingConversion = stats?.retargeting 
    ? ((stats.retargeting.converted_after_followup / Math.max(stats.retargeting.quotes_with_followups, 1)) * 100).toFixed(1)
    : "0";

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Quote Performance
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track conversions by source and retargeting effectiveness
            </p>
          </div>
          <Button onClick={loadStats} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Date Range Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(["7d", "30d", "all", "custom"] as RangePreset[]).map((p) => (
            <Button
              key={p}
              onClick={() => setPreset(p)}
              variant={preset === p ? "default" : "outline"}
              size="sm"
            >
              {p === "7d" ? "Last 7 days" : p === "30d" ? "Last 30 days" : p === "all" ? "All time" : "Custom"}
            </Button>
          ))}

          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !stats ? (
          <div className="text-center py-12 text-muted-foreground">
            Failed to load stats
          </div>
        ) : (
          <>
            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total Quotes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totals.total_quotes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Converted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.totals.total_converted}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{conversionRate}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Retarget Conv.
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{retargetingConversion}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Quotes by Source */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quotes by Source</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.by_source || {}).length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data yet</p>
                  ) : (
                    Object.entries(stats.by_source).map(([source, count]) => (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{source.replace(/_/g, ' ')}</span>
                        <span className="font-semibold bg-muted px-2 py-1 rounded text-sm">{count}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Conversion Rate by Source */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversion by Source</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.conversion_by_source || {}).length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data yet</p>
                  ) : (
                    Object.entries(stats.conversion_by_source).map(([source, rate]) => (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{source.replace(/_/g, ' ')}</span>
                        <span className={`font-semibold px-2 py-1 rounded text-sm ${
                          Number(rate) >= 20 ? 'bg-green-100 text-green-700' :
                          Number(rate) >= 10 ? 'bg-amber-100 text-amber-700' :
                          'bg-muted'
                        }`}>
                          {rate}%
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Retargeting Effectiveness */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Retargeting Effectiveness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quotes with follow-ups</span>
                    <span className="font-semibold bg-muted px-2 py-1 rounded text-sm">
                      {stats.retargeting.quotes_with_followups}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Converted after follow-up</span>
                    <span className="font-semibold bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                      {stats.retargeting.converted_after_followup}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Retargeting success rate</span>
                      <span className="font-bold text-primary">{retargetingConversion}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
