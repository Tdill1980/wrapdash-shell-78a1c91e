import { MessageSquare, Mail, AlertCircle, ArrowRight, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function MightyChatCard() {
  const navigate = useNavigate();

  // Fetch conversation stats
  const { data: stats } = useQuery({
    queryKey: ['mightychat-stats'],
    queryFn: async () => {
      const [
        { count: totalConversations },
        { count: unreadCount },
        { data: recentConversations }
      ] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }).gt('unread_count', 0),
        supabase.from('conversations')
          .select(`
            id,
            subject,
            channel,
            priority,
            status,
            last_message_at,
            contacts (name, email)
          `)
          .order('last_message_at', { ascending: false })
          .limit(3)
      ]);

      return {
        total: totalConversations || 0,
        unread: unreadCount || 0,
        recent: recentConversations || []
      };
    }
  });

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-poppins text-xl font-bold leading-tight">
            <span className="text-foreground">Mighty</span>
            <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>
            <span className="text-muted-foreground text-sm align-super">™</span>
          </CardTitle>
          {(stats?.unread || 0) > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {stats?.unread} unread
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Unified messaging hub</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-foreground">{stats?.total || 0}</div>
            <div className="text-[10px] text-muted-foreground">Conversations</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-primary">{stats?.unread || 0}</div>
            <div className="text-[10px] text-muted-foreground">Unread</div>
          </div>
        </div>

        {/* Recent Conversations */}
        {stats?.recent && stats.recent.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Recent</div>
            {stats.recent.map((conv: any) => (
              <div 
                key={conv.id}
                onClick={() => navigate(`/mightychat?conversation=${conv.id}`)}
                className="flex items-center gap-2 p-2 rounded-lg bg-background/30 hover:bg-background/50 cursor-pointer transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(conv.priority)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {conv.contacts?.name || conv.subject || 'New conversation'}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {conv.subject || conv.contacts?.email || 'No subject'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getChannelIcon(conv.channel)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No conversations yet
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={() => navigate('/mightychat')}
          className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:from-[#5B7FFF] hover:via-[#9B59B6] hover:to-[#F56A9E] text-white"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Open MightyChat
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
