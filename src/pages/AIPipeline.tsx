import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Mail, Instagram, Globe, Users, 
  FileText, Zap, TrendingUp, ArrowRight, CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AIPipeline() {
  // Fetch pipeline stats
  const { data: stats } = useQuery({
    queryKey: ['ai-pipeline-stats'],
    queryFn: async () => {
      const [
        { count: igLeads },
        { count: webLeads },
        { count: emailLeads },
        { count: quotes },
        { count: designs },
        { count: tasks }
      ] = await Promise.all([
        supabase.from('message_ingest_log').select('*', { count: 'exact', head: true }).eq('platform', 'instagram'),
        supabase.from('message_ingest_log').select('*', { count: 'exact', head: true }).eq('platform', 'website'),
        supabase.from('message_ingest_log').select('*', { count: 'exact', head: true }).eq('platform', 'email'),
        supabase.from('ai_actions').select('*', { count: 'exact', head: true }).eq('action_type', 'create_quote'),
        supabase.from('approveflow_projects').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      
      return {
        igLeads: igLeads || 0,
        webLeads: webLeads || 0,
        emailLeads: emailLeads || 0,
        quotes: quotes || 0,
        designs: designs || 0,
        tasks: tasks || 0,
      };
    },
  });

  // Fetch recent AI actions
  const { data: recentActions } = useQuery({
    queryKey: ['recent-ai-actions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            AI <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Pipeline</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified lead automation across all channels
          </p>
        </div>

        {/* Pipeline Flow Visualization */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Sources */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Instagram className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                    <Globe className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <Mail className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">Sources</span>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground" />

              {/* AI Classification */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-sm text-muted-foreground">AI Intent</span>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground" />

              {/* MightyChat */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-sm text-muted-foreground">MightyChat</span>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground" />

              {/* Outputs */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30">
                    <Users className="w-6 h-6 text-pink-400" />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">Quotes & Tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Instagram className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold">{stats?.igLeads || 0}</div>
              <p className="text-xs text-muted-foreground">Instagram DMs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold">{stats?.webLeads || 0}</div>
              <p className="text-xs text-muted-foreground">Website Chats</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold">{stats?.emailLeads || 0}</div>
              <p className="text-xs text-muted-foreground">Emails</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              <div className="text-2xl font-bold">{stats?.quotes || 0}</div>
              <p className="text-xs text-muted-foreground">Quote Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold">{stats?.designs || 0}</div>
              <p className="text-xs text-muted-foreground">Design Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-pink-400" />
              <div className="text-2xl font-bold">{stats?.tasks || 0}</div>
              <p className="text-xs text-muted-foreground">Pending Tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent AI Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent AI Actions
            </CardTitle>
            <CardDescription>
              Auto-generated quotes, tasks, and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions?.map((action: any) => (
                <div 
                  key={action.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      action.action_type === 'create_quote' ? 'default' :
                      action.action_type === 'hot_lead' ? 'destructive' :
                      'secondary'
                    }>
                      {action.action_type}
                    </Badge>
                    <span className="text-sm">
                      {action.action_payload?.source || 'unknown'} → 
                      {action.action_payload?.vehicle?.year} {action.action_payload?.vehicle?.make} {action.action_payload?.vehicle?.model || 'Vehicle TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {action.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(action.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!recentActions || recentActions.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No AI actions yet. Start chatting on Instagram or the website!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
