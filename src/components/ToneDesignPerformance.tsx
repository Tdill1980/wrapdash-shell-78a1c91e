import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Target } from "lucide-react";

interface PerformanceData {
  tone: string;
  design: string;
  totalSent: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export function ToneDesignPerformance() {
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  async function loadPerformanceData() {
    setLoading(true);
    try {
      // Get all quotes with tone, design, and conversion data
      const { data: quotes } = await supabase
        .from('quotes')
        .select('email_tone, email_design, converted_to_order, conversion_revenue');

      if (!quotes) return;

      // Group by tone + design combination
      const grouped = quotes.reduce((acc: Record<string, any>, quote) => {
        const key = `${quote.email_tone}-${quote.email_design}`;
        
        if (!acc[key]) {
          acc[key] = {
            tone: quote.email_tone || 'installer',
            design: quote.email_design || 'performance',
            totalSent: 0,
            conversions: 0,
            revenue: 0,
          };
        }
        
        acc[key].totalSent += 1;
        
        if (quote.converted_to_order) {
          acc[key].conversions += 1;
          acc[key].revenue += Number(quote.conversion_revenue) || 0;
        }
        
        return acc;
      }, {});

      // Calculate conversion rates and sort by revenue
      const performanceData: PerformanceData[] = Object.values(grouped)
        .map((item: any) => ({
          ...item,
          conversionRate: item.totalSent > 0 
            ? Math.round((item.conversions / item.totalSent) * 100) 
            : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getToneBadgeColor = (tone: string) => {
    switch (tone) {
      case 'installer': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'luxury': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'hype': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDesignBadgeColor = (design: string) => {
    switch (design) {
      case 'clean': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'luxury': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'performance': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const topPerformer = performance[0];

  return (
    <Card className="bg-[#101016] border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-lg bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">
          Campaign Performance
        </CardTitle>
        <CardDescription className="text-xs">Revenue attribution by tone & design</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Loading performance data...
          </div>
        ) : performance.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No conversion data yet
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top Performer Highlight */}
            {topPerformer && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-semibold text-green-500">TOP PERFORMER</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getToneBadgeColor(topPerformer.tone)}>
                      {topPerformer.tone}
                    </Badge>
                    <span className="text-xs text-muted-foreground">+</span>
                    <Badge className={getDesignBadgeColor(topPerformer.design)}>
                      {topPerformer.design}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-500">
                      ${(topPerformer.revenue / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {topPerformer.conversionRate}% conversion
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance List */}
            <div className="space-y-2">
              {performance.map((item, idx) => (
                <div
                  key={`${item.tone}-${item.design}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </div>
                    <Badge className={getToneBadgeColor(item.tone)} variant="outline">
                      {item.tone}
                    </Badge>
                    <span className="text-xs text-muted-foreground">×</span>
                    <Badge className={getDesignBadgeColor(item.design)} variant="outline">
                      {item.design}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>{item.conversions}/{item.totalSent}</span>
                      </div>
                      <div className="text-xs font-semibold">
                        {item.conversionRate}%
                      </div>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>Revenue</span>
                      </div>
                      <div className="text-sm font-bold text-green-500">
                        ${(item.revenue / 1000).toFixed(1)}K
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="text-xs text-muted-foreground">
                💡 Optimize campaigns by focusing on high-converting tone + design combos
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
