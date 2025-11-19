import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, MousePointerClick, Mail, TrendingUp, DollarSign, Target } from "lucide-react";

export function UTIMAnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    hotLeads: 0,
    openRate: 0,
    clickRate: 0,
    conversions: 0,
    revenue: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Get email events stats
      const { data: events } = await supabase
        .from('email_events')
        .select('event_type');

      const sent = events?.filter(e => e.event_type === 'sent').length || 0;
      const opened = events?.filter(e => e.event_type === 'opened').length || 0;
      const clicked = events?.filter(e => e.event_type === 'clicked').length || 0;

      // Get hot leads count
      const { data: quotes } = await supabase
        .from('quotes')
        .select('engagement_level')
        .eq('engagement_level', 'hot');

      const hotLeads = quotes?.length || 0;

      // Get all quotes for conversion rate
      const { data: allQuotes } = await supabase
        .from('quotes')
        .select('id');

      // Get conversion data
      const { data: conversions } = await supabase
        .from('quotes')
        .select('conversion_revenue, conversion_date')
        .eq('converted_to_order', true);

      const totalRevenue = conversions?.reduce((sum, c) => sum + (c.conversion_revenue || 0), 0) || 0;
      const totalQuotes = allQuotes?.length || 0;

      setStats({
        totalSent: sent,
        totalOpened: opened,
        totalClicked: clicked,
        hotLeads,
        openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
        conversions: conversions?.length || 0,
        revenue: totalRevenue,
        conversionRate: totalQuotes > 0 ? Math.round((conversions?.length || 0) / totalQuotes * 100) : 0,
      });
    } catch (error) {
      console.error('Error loading UTIM stats:', error);
    }
  }

  return (
    <Card className="bg-[#101016] border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-lg bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">
          Email Performance
        </CardTitle>
        <CardDescription className="text-xs">UTIM Tracking & Attribution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Mail className="h-3 w-3" />
              <span>Sent</span>
            </div>
            <div className="text-xl font-bold">{stats.totalSent}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Activity className="h-3 w-3" />
              <span>Opened</span>
            </div>
            <div className="text-xl font-bold">{stats.totalOpened}</div>
            <div className="text-xs text-muted-foreground">{stats.openRate}%</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <MousePointerClick className="h-3 w-3" />
              <span>Clicked</span>
            </div>
            <div className="text-xl font-bold">{stats.totalClicked}</div>
            <div className="text-xs text-muted-foreground">{stats.clickRate}%</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>Hot Leads</span>
            </div>
            <div className="text-xl font-bold text-green-500">{stats.hotLeads}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Target className="h-3 w-3" />
              <span>Conversions</span>
            </div>
            <div className="text-xl font-bold text-blue-500">{stats.conversions}</div>
            <div className="text-xs text-muted-foreground">{stats.conversionRate}% rate</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign className="h-3 w-3" />
              <span>Revenue</span>
            </div>
            <div className="text-xl font-bold text-green-500">
              ${(stats.revenue / 1000).toFixed(1)}K
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06]">
          <div className="text-xs text-muted-foreground">
            Full funnel attribution • Email → Quote → Order tracking
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
