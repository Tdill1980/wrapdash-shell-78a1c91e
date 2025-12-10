import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdPerformanceRecord {
  id: string;
  organization_id: string;
  ad_vault_id: string | null;
  content_queue_id: string | null;
  ad_type: "static" | "video";
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  cpc: number;
  ctr: number;
  conversion_rate: number;
  cost_per_conversion: number;
  aov: number;
  roas: number;
  platform: string;
  placement: string | null;
  campaign_name: string | null;
  ad_set_name: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  created_at: string;
  ad_vault?: {
    id: string;
    png_url: string;
    headline: string | null;
    placement: string;
    type: string;
  } | null;
}

export interface AdPerformanceTotals {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  cpc: number;
  ctr: number;
  conversionRate: number;
  costPerConversion: number;
  aov: number;
  roas: number;
}

export interface LogPerformanceInput {
  ad_vault_id?: string;
  content_queue_id?: string;
  ad_type: "static" | "video";
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  platform?: string;
  placement?: string;
  campaign_name?: string;
  ad_set_name?: string;
  date_range_start?: string;
  date_range_end?: string;
}

function calculateMetrics(input: LogPerformanceInput) {
  const { impressions, clicks, spend, conversions, revenue } = input;
  
  return {
    cpc: clicks > 0 ? spend / clicks : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    conversion_rate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    cost_per_conversion: conversions > 0 ? spend / conversions : 0,
    aov: conversions > 0 ? revenue / conversions : 0,
    roas: spend > 0 ? revenue / spend : 0,
  };
}

export function usePaidAdsPerformance(organizationId?: string) {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading, error, refetch } = useQuery({
    queryKey: ["ad-performance", organizationId],
    queryFn: async () => {
      let query = supabase
        .from("ad_performance")
        .select(`
          *,
          ad_vault (
            id,
            png_url,
            headline,
            placement,
            type
          )
        `)
        .order("created_at", { ascending: false });

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdPerformanceRecord[];
    },
    enabled: true,
  });

  // Calculate totals
  const totals: AdPerformanceTotals = records.reduce(
    (acc, record) => ({
      impressions: acc.impressions + (record.impressions || 0),
      clicks: acc.clicks + (record.clicks || 0),
      spend: acc.spend + Number(record.spend || 0),
      conversions: acc.conversions + (record.conversions || 0),
      revenue: acc.revenue + Number(record.revenue || 0),
      cpc: 0,
      ctr: 0,
      conversionRate: 0,
      costPerConversion: 0,
      aov: 0,
      roas: 0,
    }),
    {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
      cpc: 0,
      ctr: 0,
      conversionRate: 0,
      costPerConversion: 0,
      aov: 0,
      roas: 0,
    }
  );

  // Calculate derived metrics from totals
  totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  totals.conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
  totals.costPerConversion = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
  totals.aov = totals.conversions > 0 ? totals.revenue / totals.conversions : 0;
  totals.roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  // Get top performers by ROAS
  const topPerformers = [...records]
    .filter((r) => Number(r.roas) > 0)
    .sort((a, b) => Number(b.roas) - Number(a.roas))
    .slice(0, 5);

  // Group by placement
  const byPlacement = records.reduce((acc, record) => {
    const placement = record.placement || "unknown";
    if (!acc[placement]) {
      acc[placement] = { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 };
    }
    acc[placement].impressions += record.impressions || 0;
    acc[placement].clicks += record.clicks || 0;
    acc[placement].spend += Number(record.spend || 0);
    acc[placement].conversions += record.conversions || 0;
    acc[placement].revenue += Number(record.revenue || 0);
    return acc;
  }, {} as Record<string, { impressions: number; clicks: number; spend: number; conversions: number; revenue: number }>);

  // Log performance mutation
  const logMutation = useMutation({
    mutationFn: async (input: LogPerformanceInput) => {
      const metrics = calculateMetrics(input);
      
      const { data: orgData } = await supabase.rpc("get_user_organization_id");
      
      const { data, error } = await supabase
        .from("ad_performance")
        .insert({
          organization_id: orgData || organizationId,
          ...input,
          ...metrics,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-performance"] });
      toast.success("Performance logged successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to log performance: ${err.message}`);
    },
  });

  return {
    records,
    totals,
    topPerformers,
    byPlacement,
    isLoading,
    error,
    refetch,
    logPerformance: logMutation.mutate,
    isLogging: logMutation.isPending,
  };
}
