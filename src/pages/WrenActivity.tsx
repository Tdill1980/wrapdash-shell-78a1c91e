import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  GitCommit, 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Code,
  FileCode,
  RefreshCw,
  Terminal
} from "lucide-react";

interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'critical';
  latency_ms: number;
  message: string;
}

interface MonitorReport {
  overall_status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheck[];
  metrics: {
    chats_today: number;
    emails_captured_today: number;
    email_capture_rate: number;
    quotes_created_today: number;
    quotes_emailed_today: number;
  };
  alerts: string[];
  timestamp: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  status: 'success' | 'error' | 'pending';
  created_at: string;
}

export default function WrenActivity() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [monitor, setMonitor] = useState<MonitorReport | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch GitHub commits
  useEffect(() => {
    async function fetchCommits() {
      try {
        const res = await fetch(
          'https://api.github.com/repos/Tdill1980/wrapdash-shell-78a1c91e/commits?per_page=15'
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setCommits(data.map((c: any) => ({
            sha: c.sha?.substring(0, 7) || '',
            message: c.commit?.message?.split('\n')[0] || '',
            author: c.commit?.author?.name || 'Unknown',
            date: c.commit?.author?.date || '',
            url: c.html_url || ''
          })));
        }
      } catch (err) {
        console.error('Failed to fetch commits:', err);
      }
      setLoading(false);
    }
    fetchCommits();
  }, []);

  // Run health check
  async function runHealthCheck() {
    setMonitorLoading(true);
    try {
      const res = await fetch(
        'https://qxllysilzonrlyoaomce.supabase.co/functions/v1/wren-monitor',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bGx5c2lsem9ucmx5b2FvbWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MTcxMjUsImV4cCI6MjA1MjI5MzEyNX0.s1IyOY7QAVyrTtG_XLhugJUvxi2X_nHCvqvchYCvwtM'
          }
        }
      );
      const data = await res.json();
      setMonitor(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Health check failed:', err);
      setMonitor({
        overall_status: 'critical',
        checks: [],
        metrics: { chats_today: 0, emails_captured_today: 0, email_capture_rate: 0, quotes_created_today: 0, quotes_emailed_today: 0 },
        alerts: ['Failed to run health check: ' + (err as Error).message],
        timestamp: new Date().toISOString()
      });
    }
    setMonitorLoading(false);
  }

  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    critical: 'bg-red-500',
    ok: 'text-green-400',
    warning: 'text-yellow-400'
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok' || status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'warning' || status === 'degraded') return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <AlertTriangle className="w-4 h-4 text-red-400" />;
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Wren Activity
            </h1>
            <p className="text-slate-400 mt-1">AI Agent monitoring and activity log</p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-slate-500">
                Last check: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button 
              onClick={runHealthCheck} 
              disabled={monitorLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              {monitorLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Run Health Check
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        {monitor && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${statusColors[monitor.overall_status]} animate-pulse`} />
                  <div>
                    <h2 className="text-xl font-semibold text-white capitalize">
                      System {monitor.overall_status}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {monitor.checks.filter(c => c.status === 'ok').length}/{monitor.checks.length} checks passing
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{monitor.metrics.chats_today}</div>
                    <div className="text-xs text-slate-400">Chats Today</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{monitor.metrics.emails_captured_today}</div>
                    <div className="text-xs text-slate-400">Emails Captured</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{monitor.metrics.email_capture_rate}%</div>
                    <div className="text-xs text-slate-400">Capture Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{monitor.metrics.quotes_created_today}</div>
                    <div className="text-xs text-slate-400">Quotes Created</div>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {monitor.alerts.length > 0 && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alerts ({monitor.alerts.length})
                  </h3>
                  <ul className="space-y-1">
                    {monitor.alerts.map((alert, i) => (
                      <li key={i} className="text-sm text-red-300">{alert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="health" className="space-y-4">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="health" className="data-[state=active]:bg-slate-700">
              <Heart className="w-4 h-4 mr-2" />
              Health Checks
            </TabsTrigger>
            <TabsTrigger value="commits" className="data-[state=active]:bg-slate-700">
              <GitCommit className="w-4 h-4 mr-2" />
              Code Changes
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-slate-700">
              <FileCode className="w-4 h-4 mr-2" />
              Key Files
            </TabsTrigger>
          </TabsList>

          {/* Health Checks Tab */}
          <TabsContent value="health">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  System Health Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!monitor ? (
                  <div className="text-center py-8 text-slate-400">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Run Health Check" to test all systems</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monitor.checks.map((check, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          check.status === 'ok' ? 'bg-green-500/5 border-green-500/20' :
                          check.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                          'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon status={check.status} />
                          <div>
                            <div className="font-medium text-white">{check.name}</div>
                            <div className="text-sm text-slate-400">{check.message}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={check.status === 'ok' ? 'default' : 'destructive'}>
                            {check.status.toUpperCase()}
                          </Badge>
                          <div className="text-xs text-slate-500 mt-1">{check.latency_ms}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commits Tab */}
          <TabsContent value="commits">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-purple-400" />
                  Recent Code Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Loading commits...</div>
                ) : (
                  <div className="space-y-2">
                    {commits.map((commit) => (
                      <a
                        key={commit.sha}
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <Code className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{commit.message}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="font-mono text-purple-400">{commit.sha}</span>
                            <span>•</span>
                            <span>{commit.author}</span>
                            <span>•</span>
                            <span>{new Date(commit.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Key Files Tab */}
          <TabsContent value="files">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  Key System Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { path: 'public/embed/chat-widget.js', desc: 'Chat widget (Name/Email/Phone required)' },
                    { path: 'supabase/functions/command-chat/index.ts', desc: 'AI Chat Kernel - Jordan' },
                    { path: 'supabase/functions/wren-monitor/index.ts', desc: 'Health monitoring agent' },
                    { path: 'supabase/functions/cmd-vehicle/index.ts', desc: 'Vehicle database lookup' },
                    { path: 'supabase/functions/cmd-pricing/index.ts', desc: 'Pricing calculation' },
                    { path: 'supabase/functions/create-quote-from-chat/index.ts', desc: 'Quote creation + email' },
                    { path: 'ARCHITECTURE-BIBLE.md', desc: 'System architecture documentation' },
                    { path: 'src/pages/WebsiteAdmin.tsx', desc: 'Website chat admin page' },
                  ].map((file) => (
                    <a
                      key={file.path}
                      href={`https://github.com/Tdill1980/wrapdash-shell-78a1c91e/blob/main/${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-cyan-300 font-mono truncate">{file.path}</div>
                        <div className="text-xs text-slate-500">{file.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
