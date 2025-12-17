import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, Download, Car, DollarSign, Wrench, TestTubeDiagonal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function ToolsTab() {
  const [testing, setTesting] = useState(false);

  const runSmokeTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("website-chat", {
        body: {
          org: "wpw",
          agent: "wpw_ai_team",
          mode: "test",
          session_id: `admin_smoke_${Date.now()}`,
          message_text: "Quick test: need a quote for a 2020 Ford Transit full wrap. Email: test@example.com",
          page_url: "https://admin.test/website-agent",
          referrer: "",
        },
      });

      if (error) throw error;

      const price = data?.auto_quote?.formattedPrice;
      toast.success(price ? `Website chat OK — auto quote: ${price}` : "Website chat OK — reply generated");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Smoke test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
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

        {/* Smoke Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTubeDiagonal className="h-5 w-5 text-green-500" />
              Smoke Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Test Jordan's chat and quote generation
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={runSmokeTest}
              disabled={testing}
            >
              {testing ? "Testing..." : "Run Test"}
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
