import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Brain, Zap, TestTubeDiagonal, Database, Shield, Activity } from "lucide-react";

export function AgenticAITab() {
  return (
    <div className="space-y-6">
      {/* AI Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jordan's Status</CardTitle>
            <Brain className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                ONLINE
              </Badge>
              <span className="text-sm text-muted-foreground">Active & Learning</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Model Version</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">gemini-2.5-flash</div>
            <p className="text-xs text-muted-foreground">Latest stable</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">TradeDNA Status</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                LOADED
              </Badge>
              <span className="text-sm text-muted-foreground">WPW Voice Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTubeDiagonal className="h-5 w-5 text-primary" />
            Agentic AI Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">Auto-Learning Mode</div>
                  <p className="text-sm text-muted-foreground">Learn from successful conversations</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">A/B Testing</div>
                  <p className="text-sm text-muted-foreground">Test different response styles</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">Auto Quote Generation</div>
                  <p className="text-sm text-muted-foreground">Generate quotes from chat context</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">Escalation Alerts</div>
                  <p className="text-sm text-muted-foreground">Alert Jackson on complex queries</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">Memory Retention</div>
                  <p className="text-sm text-muted-foreground">Remember returning visitors</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">Sentiment Analysis</div>
                  <p className="text-sm text-muted-foreground">Detect customer mood</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Agentic AI Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <Database className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="font-medium text-green-500">Memory Active</div>
              <p className="text-xs text-muted-foreground">1,247 conversations stored</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
              <Brain className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="font-medium text-blue-500">Learning Mode</div>
              <p className="text-xs text-muted-foreground">Continuously improving</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
              <Shield className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="font-medium text-purple-500">TradeDNA Loaded</div>
              <p className="text-xs text-muted-foreground">WPW brand voice active</p>
            </div>
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
              <Zap className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="font-medium text-orange-500">Response Time</div>
              <p className="text-xs text-muted-foreground">4.2s average</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
