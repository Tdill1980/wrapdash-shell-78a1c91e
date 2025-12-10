import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePaidAdsPerformance } from "@/hooks/usePaidAdsPerformance";
import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign, Target, ShoppingCart, BarChart3 } from "lucide-react";

export function AdPerformanceCard() {
  const navigate = useNavigate();
  const { totals, topPerformers, isLoading } = usePaidAdsPerformance();

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const bestAd = topPerformers[0];

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="bg-gradient-to-r from-[#405DE6] to-[#E1306C] bg-clip-text text-transparent">
              Paid Ads Performance
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/paid-ads-performance")}
          >
            View →
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            {/* Metrics Row */}
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3" /> Ad Spend
                </div>
                <div className="text-sm font-semibold">{formatCurrency(totals.spend)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">CPC</div>
                <div className="text-sm font-semibold">${totals.cpc.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                  <Target className="w-3 h-3" /> Conv
                </div>
                <div className="text-sm font-semibold">{formatNumber(totals.conversions)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> AOV
                </div>
                <div className="text-sm font-semibold">{formatCurrency(totals.aov)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" /> ROAS
                </div>
                <div className="text-sm font-semibold text-green-500">{totals.roas.toFixed(1)}x</div>
              </div>
            </div>

            {/* Cost Per Conversion */}
            <div className="flex items-center justify-between text-xs border-t border-border/50 pt-3">
              <span className="text-muted-foreground">Cost Per Conversion</span>
              <span className="font-semibold text-amber-500">{formatCurrency(totals.costPerConversion)}</span>
            </div>

            {/* Best Performer */}
            {bestAd && (
              <div className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                <span className="text-foreground">Best:</span>{" "}
                "{bestAd.ad_vault?.headline || "Ad"}" •{" "}
                <span className="text-green-500">{Number(bestAd.roas).toFixed(1)}x ROAS</span> •{" "}
                <span className="text-primary">${Number(bestAd.cpc).toFixed(2)} CPC</span>
              </div>
            )}

            {totals.spend === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                No ad performance data yet. Log metrics from Ad Vault.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
