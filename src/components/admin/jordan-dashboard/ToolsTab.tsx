import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, Download, Car, DollarSign, Wrench, Activity, Play, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { BacklogTable } from "./BacklogTable";
import { AIActionsQueueTable } from "./AIActionsQueueTable";
import { ExecutionReceiptsTable } from "./ExecutionReceiptsTable";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SystemStats {
  pendingActions: number;
  backlogCount: number;
  recentSuccesses: number;
  recentFailures: number;
}

export function ToolsTab() {
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    pendingActions: 0,
    backlogCount: 0,
    recentSuccesses: 0,
    recentFailures: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [receiptsOpen, setReceiptsOpen] = useState(false);

  const fetchStats = async () => {
    try {
      // Fetch pending AI actions count
      const { count: pendingCount } = await supabase
        .from("ai_actions")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "processing"]);

      // Fetch TRUE backlog count from the view
      const { count: backlogCount, error: backlogError } = await supabase
        .from("ops_backlog_needs_response" as any)
        .select("*", { count: "exact", head: true });
      
      if (backlogError) console.error("Backlog count error:", backlogError);

      // Fetch recent successes (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: successCount } = await supabase
        .from("execution_receipts")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "success", "executed"])
        .gte("created_at", oneDayAgo);

      // Fetch recent failures (last 24h)
      const { count: failureCount } = await supabase
        .from("execution_receipts")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", oneDayAgo);

      setStats({
        pendingActions: pendingCount || 0,
        backlogCount: backlogCount || 0,
        recentSuccesses: successCount || 0,
        recentFailures: failureCount || 0,
      });
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const processAIActions = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-ai-actions");

      if (error) throw error;

      const processed = data?.processed || 0;
      const failed = data?.failed || 0;
      const skipped = data?.skipped || 0;

      toast.success(`Processed: ${processed}, Failed: ${failed}, Skipped: ${skipped}`);
      
      // Refresh stats after processing
      fetchStats();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to process AI actions");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Ops Desk
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${statsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={processAIActions}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className={`h-4 w-4 mr-1 ${processing ? "animate-pulse" : ""}`} />
              {processing ? "Processing..." : "Process AI Actions"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {statsLoading ? "..." : stats.pendingActions}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Pending Actions
              </div>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-400">
                {statsLoading ? "..." : stats.backlogCount}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                Needs Response
              </div>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">
                {statsLoading ? "..." : stats.recentSuccesses}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3" />
                Sent (24h)
              </div>
            </div>
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-400">
                {statsLoading ? "..." : stats.recentFailures}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                Failed (24h)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Tables */}
      <div className="space-y-4">
        <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    AI Actions Queue
                  </span>
                  {actionsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <AIActionsQueueTable />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={backlogOpen} onOpenChange={setBacklogOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Conversation Backlog (Needs Response)
                  </span>
                  {backlogOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <BacklogTable />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={receiptsOpen} onOpenChange={setReceiptsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Execution History
                  </span>
                  {receiptsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ExecutionReceiptsTable />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Tool Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Database Console */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Database Console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Access database tables and run queries
            </p>
            <Button variant="outline" className="w-full">
              Open Console
            </Button>
          </CardContent>
        </Card>

        {/* Vehicle Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-500" />
              Vehicle Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              1,664 vehicles with square footage data
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/vehicles">Manage Vehicles</a>
            </Button>
          </CardContent>
        </Card>

        {/* Product Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Product Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage WPW product prices and margins
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/pricing">Manage Pricing</a>
            </Button>
          </CardContent>
        </Card>

        {/* Export Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-orange-500" />
              Export Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Export chats, quotes, and analytics data
            </p>
            <Button variant="outline" className="w-full">
              Export Data
            </Button>
          </CardContent>
        </Card>

        {/* AI Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-red-500" />
              AI Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage AI corrections and knowledge base
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/ai-corrections">AI Corrections</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <div className="font-medium text-green-500">Website Chat</div>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <div className="font-medium text-green-500">TradeDNA</div>
              <p className="text-xs text-muted-foreground">Loaded</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <div className="font-medium text-green-500">Quote Engine</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <div className="font-medium text-green-500">Email Service</div>
              <p className="text-xs text-muted-foreground">Connected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
