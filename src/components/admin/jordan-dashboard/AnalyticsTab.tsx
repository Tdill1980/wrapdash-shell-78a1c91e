import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Brain, TrendingUp, MessageSquare, FileText, Percent, BarChart, Loader2 } from "lucide-react";
import { useWebsiteChatAnalytics } from "@/hooks/useWebsiteChatAnalytics";

export function AnalyticsTab() {
  const { data: analytics, isLoading } = useWebsiteChatAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue Generated
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">From AI-assisted quotes</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emails Captured
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {analytics?.emailsCaptured || 0}
            </div>
            <p className="text-xs text-muted-foreground">From website chat</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Engagement Rate
            </CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {analytics?.totalChats || 0 > 0 ? "Active" : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Chat completion rate</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lead Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {analytics?.conversionRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Chat to quote conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Automation Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Automation Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-500">
                {analytics?.autoResponses || 0}
              </div>
              <p className="text-sm text-muted-foreground">Auto Responses</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-500">
                {analytics?.quotesGenerated || 0}
              </div>
              <p className="text-sm text-muted-foreground">Quotes Generated</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-500">
                {analytics?.quoteConversions || 0}
              </div>
              <p className="text-sm text-muted-foreground">Quote Conversions</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-500">
                {analytics?.avgMessages || 0}
              </div>
              <p className="text-sm text-muted-foreground">Avg Messages/Chat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jordan's Learning Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Jordan's Learning Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Chats</span>
              </div>
              <div className="text-2xl font-bold">{analytics?.totalChats || 0}</div>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Quote Conversions</span>
              </div>
              <div className="text-2xl font-bold">{analytics?.quoteConversions || 0}</div>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
              </div>
              <div className="text-2xl font-bold">{analytics?.conversionRate || 0}%</div>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Avg Messages</span>
              </div>
              <div className="text-2xl font-bold">{analytics?.avgMessages || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
