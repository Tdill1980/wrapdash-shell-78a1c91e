import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TimePeriod = "today" | "7days" | "mtd" | "all";

interface DashboardStats {
  revenue: number;
  revenueChange: number;
  totalOrders: number;
  activeJobs: number;
  completedOrders: number;
  customers: number;
  pendingApprovals: number;
  portfolioJobs: number;
  totalRenders: number;
}

export function useDashboardStats(period: TimePeriod = "mtd") {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    activeJobs: 0,
    completedOrders: 0,
    customers: 0,
    pendingApprovals: 0,
    portfolioJobs: 0,
    totalRenders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  function getDateRange(p: TimePeriod): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const now = new Date();
    const end = now;
    let start: Date;
    let prevStart: Date;
    let prevEnd: Date;

    switch (p) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - 1);
        prevEnd = new Date(start);
        break;
      case "7days":
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd = new Date(start);
        break;
      case "mtd":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of prev month
        break;
      case "all":
      default:
        start = new Date(2020, 0, 1); // Far past
        prevStart = new Date(2020, 0, 1);
        prevEnd = new Date(2020, 0, 1);
        break;
    }

    return { start, end, prevStart, prevEnd };
  }

  async function loadStats() {
    setLoading(true);
    try {
      const { start, end, prevStart, prevEnd } = getDateRange(period);
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const prevStartISO = prevStart.toISOString();
      const prevEndISO = prevEnd.toISOString();

      // Fetch all data in parallel
      const [
        ordersResult,
        prevOrdersResult,
        activeJobsResult,
        completedResult,
        contactsResult,
        approvalsResult,
        portfolioResult,
        rendersResult,
      ] = await Promise.all([
        // Current period orders with totals
        supabase
          .from("shopflow_orders")
          .select("order_total, created_at")
          .gte("created_at", startISO)
          .lte("created_at", endISO),
        // Previous period orders for comparison
        supabase
          .from("shopflow_orders")
          .select("order_total")
          .gte("created_at", prevStartISO)
          .lt("created_at", startISO),
        // Active jobs (in production, design, etc.)
        supabase
          .from("shopflow_orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["in_production", "design_requested", "order_received", "in_design", "awaiting_approval"]),
        // Completed orders
        supabase
          .from("shopflow_orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),
        // Contacts
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true }),
        // Pending approvals
        supabase
          .from("approveflow_projects")
          .select("id", { count: "exact", head: true })
          .in("status", ["design_requested", "awaiting_approval"]),
        // Portfolio jobs
        supabase
          .from("portfolio_jobs")
          .select("id", { count: "exact", head: true }),
        // Total renders
        supabase
          .from("color_visualizations")
          .select("id", { count: "exact", head: true }),
      ]);

      // Calculate revenue
      const currentRevenue = ordersResult.data?.reduce(
        (sum, order) => sum + (Number(order.order_total) || 0),
        0
      ) || 0;

      const prevRevenue = prevOrdersResult.data?.reduce(
        (sum, order) => sum + (Number(order.order_total) || 0),
        0
      ) || 0;

      // Calculate change percentage
      let revenueChange = 0;
      if (prevRevenue > 0) {
        revenueChange = Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);
      } else if (currentRevenue > 0) {
        revenueChange = 100;
      }

      setStats({
        revenue: currentRevenue,
        revenueChange,
        totalOrders: ordersResult.data?.length || 0,
        activeJobs: activeJobsResult.count || 0,
        completedOrders: completedResult.count || 0,
        customers: contactsResult.count || 0,
        pendingApprovals: approvalsResult.count || 0,
        portfolioJobs: portfolioResult.count || 0,
        totalRenders: rendersResult.count || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, refetch: loadStats };
}
