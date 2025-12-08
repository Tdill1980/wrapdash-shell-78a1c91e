import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Mail, Instagram, MessageCircle, ArrowRight, Bell } from "lucide-react";

interface ConversationSummary {
  id: string;
  channel: string;
  subject: string | null;
  unread_count: number;
  priority: string | null;
  last_message_at: string | null;
}

export function MightyChatCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('mightychat-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadConversations() {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, channel, subject, unread_count, priority, last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const conversations = data || [];
      setRecentConversations(conversations);
      
      // Calculate stats
      const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      
      // Get total count
      const { count } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true });

      setStats({
        total: count || 0,
        unread: totalUnread
      });
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'instagram':
        return <Instagram className="w-3 h-3" />;
      case 'sms':
        return <MessageCircle className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Card className="dashboard-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="dashboard-card-title text-lg font-bold font-poppins">
              <span className="text-foreground">Mighty</span>
              <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>
              <span className="text-muted-foreground text-sm align-super">™</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Unified Inbox: DM, Email, SMS
            </p>
          </div>
          {stats.unread > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {stats.unread}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Stats Row */}
        <div className="flex gap-4 text-center">
          <div className="flex-1 p-2 rounded-md bg-muted/50">
            <div className="text-xl font-bold text-foreground">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Conversations</div>
          </div>
          <div className="flex-1 p-2 rounded-md bg-muted/50">
            <div className="text-xl font-bold text-foreground">{stats.unread}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Unread</div>
          </div>
        </div>

        {/* Channel Icons Row */}
        <div className="flex justify-center gap-4 py-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="w-4 h-4 text-primary" />
            <span>Email</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Instagram className="w-4 h-4 text-[#E1306C]" />
            <span>DM</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="w-4 h-4 text-green-500" />
            <span>SMS</span>
          </div>
        </div>

        {/* Recent Conversations */}
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
        ) : recentConversations.length > 0 ? (
          <div className="space-y-2">
            {recentConversations.slice(0, 3).map((conv) => (
              <div
                key={conv.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/mightychat?id=${conv.id}`)}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  {getChannelIcon(conv.channel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {conv.subject || 'No subject'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatTime(conv.last_message_at)}
                  </div>
                </div>
                {conv.priority && conv.priority !== 'normal' && (
                  <Badge className={`text-[10px] ${getPriorityColor(conv.priority)}`}>
                    {conv.priority}
                  </Badge>
                )}
                {(conv.unread_count || 0) > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">
            No conversations yet
          </div>
        )}

        {/* Open MightyChat Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => navigate("/mightychat")}
        >
          Open MightyChat
          <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
