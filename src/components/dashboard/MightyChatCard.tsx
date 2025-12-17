import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  Mail, 
  Palette, 
  MessageSquare, 
  Brain,
  ArrowRight, 
  Bell,
  Flame,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

interface WorkStreamStats {
  websiteLeads: number;
  quotesWaiting: number;
  designReviews: number;
  socialDMs: number;
  opsDesk: number;
  totalUnread: number;
  highValue: number;
  cxRisk: number;
}

interface WorkItem {
  id: string;
  channel: string;
  subject: string | null;
  intent?: string;
  status?: string;
  priority: string | null;
  review_status?: string | null;
  last_message_at: string | null;
  metadata?: unknown;
}

const WORK_STREAMS = [
  { key: 'websiteLeads', label: 'Website Leads', icon: Globe, color: 'text-blue-400', stream: 'website' },
  { key: 'quotesWaiting', label: 'Quotes Waiting', icon: Mail, color: 'text-amber-400', stream: 'quotes' },
  { key: 'designReviews', label: 'Design Reviews', icon: Palette, color: 'text-purple-400', stream: 'design' },
  { key: 'socialDMs', label: 'Social DMs', icon: MessageSquare, color: 'text-pink-400', stream: 'social' },
  { key: 'opsDesk', label: 'Ops Desk', icon: Brain, color: 'text-emerald-400', stream: 'ops' },
] as const;

export function MightyChatCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<WorkStreamStats>({
    websiteLeads: 0,
    quotesWaiting: 0,
    designReviews: 0,
    socialDMs: 0,
    opsDesk: 0,
    totalUnread: 0,
    highValue: 0,
    cxRisk: 0
  });
  const [topItems, setTopItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkStreams();

    const channel = supabase
      .channel('mightychat-dashboard-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadWorkStreams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_actions' }, () => loadWorkStreams())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadWorkStreams() {
    try {
      // Fetch conversations with metadata
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id, channel, subject, unread_count, priority, review_status, last_message_at, metadata, recipient_inbox")
        .order("last_message_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const convs = conversations || [];

      // Categorize into work streams
      const websiteLeads = convs.filter(c => c.channel === 'website').length;
      const quotesWaiting = convs.filter(c => c.recipient_inbox === 'hello' || c.priority === 'high').length;
      const designReviews = convs.filter(c => c.recipient_inbox === 'design').length;
      const socialDMs = convs.filter(c => c.channel === 'instagram').length;
      
      // Get Ops Desk count
      const { count: opsCount } = await supabase
        .from("ai_actions")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false);

      // Calculate signals
      const totalUnread = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      const highValue = convs.filter(c => 
        c.priority === 'high' || 
        (c.metadata as any)?.intent === 'commercial'
      ).length;
      const cxRisk = convs.filter(c => 
        c.priority === 'urgent' || 
        c.review_status === 'pending_review'
      ).length;

      setStats({
        websiteLeads,
        quotesWaiting,
        designReviews,
        socialDMs,
        opsDesk: opsCount || 0,
        totalUnread,
        highValue,
        cxRisk
      });

      // Get top priority items for quick view
      const priorityItems = convs
        .filter(c => c.priority === 'urgent' || c.priority === 'high' || c.unread_count > 0)
        .slice(0, 3)
        .map(c => ({
          ...c,
          intent: deriveIntent(c),
          status: deriveStatus(c)
        }));

      setTopItems(priorityItems);
    } catch (err) {
      console.error("Error loading work streams:", err);
    } finally {
      setLoading(false);
    }
  }

  function deriveIntent(conv: any): string {
    const subject = (conv.subject || '').toLowerCase();
    const metadata = conv.metadata as any;
    
    if (metadata?.intent) return metadata.intent;
    if (subject.includes('quote') || subject.includes('price')) return 'Quote Request';
    if (subject.includes('design') || subject.includes('file')) return 'Design Inquiry';
    if (conv.channel === 'website') return 'Website Lead';
    if (conv.channel === 'instagram') return 'Social DM';
    return 'General';
  }

  function deriveStatus(conv: any): string {
    if (conv.review_status === 'pending_review') return 'Needs Review';
    if (conv.priority === 'urgent') return 'Urgent';
    if (conv.priority === 'high') return 'High Priority';
    if (conv.unread_count > 0) return 'Unread';
    return 'Open';
  }

  function getIntentColor(intent: string): string {
    switch (intent) {
      case 'Quote Request': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Design Inquiry': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Website Lead': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Social DM': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  }

  function getStatusBadge(status: string): { color: string; icon?: typeof Flame } {
    switch (status) {
      case 'Urgent': return { color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle };
      case 'High Priority': return { color: 'bg-orange-500/20 text-orange-400', icon: Flame };
      case 'Needs Review': return { color: 'bg-red-500/20 text-red-400' };
      default: return { color: 'bg-muted/50 text-muted-foreground' };
    }
  }

  const handleStreamClick = (stream: string) => {
    if (stream === 'ops') {
      navigate('/mightychat?mode=ops');
    } else {
      navigate(`/mightychat?stream=${stream}`);
    }
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
              Work Streams • Intent-Based Routing
            </p>
          </div>
          {stats.totalUnread > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {stats.totalUnread}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Signal Badges */}
        {(stats.highValue > 0 || stats.cxRisk > 0) && (
          <div className="flex gap-2 flex-wrap">
            {stats.highValue > 0 && (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.highValue} High Value
              </Badge>
            )}
            {stats.cxRisk > 0 && (
              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {stats.cxRisk} CX Risk
              </Badge>
            )}
          </div>
        )}

        {/* Work Streams Grid */}
        <div className="grid grid-cols-5 gap-1">
          {WORK_STREAMS.map((stream) => {
            const count = stats[stream.key as keyof WorkStreamStats] as number;
            const Icon = stream.icon;
            return (
              <button
                key={stream.key}
                onClick={() => handleStreamClick(stream.stream)}
                className="flex flex-col items-center p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <Icon className={`w-4 h-4 ${stream.color} group-hover:scale-110 transition-transform`} />
                <span className="text-lg font-bold text-foreground mt-1">{count}</span>
                <span className="text-[8px] text-muted-foreground text-center leading-tight">
                  {stream.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Top Priority Work Items */}
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
        ) : topItems.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Priority Work
            </div>
            {topItems.map((item) => {
              const statusStyle = getStatusBadge(item.status || '');
              return (
                <div
                  key={item.id}
                  className="p-2 rounded-md bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors border border-border/50"
                  onClick={() => navigate(`/mightychat?id=${item.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getIntentColor(item.intent || '')}`}>
                          {item.intent}
                        </Badge>
                        {item.status && item.status !== 'Open' && (
                          <Badge className={`text-[9px] px-1.5 py-0 ${statusStyle.color}`}>
                            {statusStyle.icon && <statusStyle.icon className="w-2 h-2 mr-0.5" />}
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-foreground truncate">
                        {item.subject || 'No subject'}
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">
            All caught up! No priority items.
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
