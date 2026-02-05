import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  ArrowRight,
  Briefcase,
  ShoppingCart,
  FolderOpen,
  Film,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/layouts/MainLayout";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MightyChatCard } from "@/components/dashboard/MightyChatCard";
import { MightyCustomerCard } from "@/components/dashboard/MightyCustomerCard";
import { EscalationsDashboardCard } from "@/components/dashboard/EscalationsDashboardCard";
import { PhoneCallsDashboardCard } from "@/components/dashboard/PhoneCallsDashboardCard";
import dashboardHeroImage from "@/assets/dashboard-hero-wrap.jpg";

export default function Dashboard() {
  const navigate = useNavigate();
  const { orders: shopflowOrders, loading: shopflowLoading } = useShopFlow();
  const [authChecked, setAuthChecked] = useState(false);

  // Dashboard is an authenticated admin surface. Without a valid session, RLS will correctly
  // return zero rows for protected tables like conversations.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        console.warn("[Dashboard] getSession error", error);
      }

      if (!data.session) {
        navigate("/auth", { replace: true });
        return;
      }

      setAuthChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Fetch pending approvals count from approveflow_projects
  const { data: pendingApprovals } = useQuery({
    queryKey: ["dashboard-pending-approvals"],
    queryFn: async () => {
      const { count } = await supabase
        .from("approveflow_projects")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending_approval", "awaiting_approval", "pending"]);
      return count || 0;
    },
  });

  // Quote requests should reflect pending AI actions (not ShopFlow order statuses)
  const { data: pendingQuoteActionsCount } = useQuery({
    queryKey: ["dashboard-pending-quote-actions"],
    enabled: authChecked,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ai_actions")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false)
        .in("action_type", ["create_quote", "auto_quote_generated"]);

      if (error) {
        console.error("[Dashboard] pending quote actions count error", error);
        return 0;
      }

      return count || 0;
    },
  });

  // Fetch affiliate stats (neutral - no revenue)
  const { data: affiliateStats } = useQuery({
    queryKey: ["dashboard-affiliate-stats"],
    queryFn: async () => {
      const [{ count: activeAffiliates }, { count: pendingCommissions }] = await Promise.all([
        supabase
          .from("affiliate_founders")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("affiliate_commissions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return {
        activeAffiliates: activeAffiliates || 0,
        pendingCommissions: pendingCommissions || 0,
      };
    },
  });

  // Fetch recent activity from shopflow orders
  const { data: recentActivity } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shopflow_orders")
        .select("id, woo_order_number, order_number, status, updated_at, customer_name")
        .neq("hidden", true)
        .neq("is_paid", false)
        .order("updated_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Calculate operational counts
  const activeJobsCount = shopflowOrders?.filter(
    (o) => o.status === "in_production" || o.status === "awaiting_feedback" || o.status === "revision_sent"
  ).length || 0;
  
  const openOrdersCount = shopflowOrders?.filter(
    (o) => o.status === "order_received" || o.status === "design_requested"
  ).length || 0;
  
  const quoteRequestsCount = pendingQuoteActionsCount ?? 0;

  // Format activity item
  const getActivityIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "ready_for_print":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "order_received":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "awaiting_feedback":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (status: string) => {
    switch (status) {
      case "approved":
      case "ready_for_print":
        return "Approval received";
      case "order_received":
        return "Order received";
      case "awaiting_feedback":
        return "Awaiting feedback";
      case "production_pack_ready":
        return "Production pack ready";
      default:
        return status.replace(/_/g, " ");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <MainLayout userName="Admin">
      <div className="w-full space-y-6 max-w-6xl mx-auto">
        {/* ============================================================ */}
        {/* HERO DASHBOARD CARD                                         */}
        {/* To change the background image, replace the URL below:      */}
        {/* ============================================================ */}
        <div className="relative w-full h-40 sm:h-48 overflow-hidden rounded-xl sm:rounded-2xl border border-white/10">
          {/* BACKGROUND IMAGE - To change: replace dashboard-hero-wrap.jpg in src/assets/ */}
          <img
            src={dashboardHeroImage}
            alt="Vehicle wrap background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Content: Title on left, Button on right */}
          <div className="relative z-10 h-full flex items-center justify-between px-6 sm:px-10">
            <div className="bg-black/70 px-4 py-3 rounded-lg backdrop-blur-sm">
              <h1 className="font-['Poppins'] text-2xl sm:text-4xl font-extrabold tracking-wide text-white mb-1">
                WePrintWraps.com <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">Dashboard</span>
              </h1>
              <p className="text-white/80 text-sm sm:text-base font-medium">
                Operational overview • Command Center
              </p>
            </div>
            <Button
              onClick={() => navigate("/organic/reel-builder")}
              className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] hover:from-[#1E6FE0] hover:to-[#00B8E6] text-white font-semibold shadow-lg hover:shadow-xl transition-all hidden sm:flex"
            >
              <Film className="w-4 h-4 mr-2" />
              Create Video Ad
            </Button>
          </div>
        </div>

        {/* Section 1: Today - Operational Status */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Today
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Active Jobs */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {shopflowLoading ? "..." : activeJobsCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {pendingApprovals ?? "..."}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending Approvals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Open Orders */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Package className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {shopflowLoading ? "..." : openOrdersCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Open Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Requests */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileText className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {!authChecked ? "..." : quoteRequestsCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Quote Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 2: MightyCustomer - The Brain (Full Width) */}
        <MightyCustomerCard />

        {/* Section 3: MightyChat, Phone Calls & Escalations */}
        <div className="grid md:grid-cols-3 gap-4">
          <MightyChatCard />
          <PhoneCallsDashboardCard />
          <EscalationsDashboardCard />
        </div>

        {/* Section 3: MightyAffiliate Status */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              MightyAffiliate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {affiliateStats?.activeAffiliates ?? "..."}
                  </p>
                  <p className="text-xs text-muted-foreground">Active affiliates</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {affiliateStats?.pendingCommissions ?? "..."}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending commissions</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/affiliate/admin")}
                className="text-xs"
              >
                Open MightyAffiliate
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Recent Activity */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getActivityIcon(activity.status)}
                      <div>
                        <span className="text-sm text-muted-foreground">
                          {getActivityLabel(activity.status)}:
                        </span>
                        <span className="text-sm text-foreground ml-1 font-medium">
                          #{activity.woo_order_number || activity.order_number}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.updated_at)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Quick Actions */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/30"
              onClick={() => navigate("/approveflow")}
            >
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">ApproveFlow</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/30"
              onClick={() => navigate("/my-shopflow")}
            >
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">ShopFlow</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/30"
              onClick={() => navigate("/designvault")}
            >
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Design Vault</span>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
