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
  TrendingUp,
  Instagram,
  Phone
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
  hotLeads: number;
  instagram: number;
  email: number;
  website: number;
  phone: number;
  pendingQuotes: number;
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

const CHANNEL_CARDS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', bgColor: 'bg-pink-500/10', filter: 'instagram' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-green-500', bgColor: 'bg-green-500/10', filter: 'email' },
  { key: 'website', label: 'Website', icon: Globe, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', filter: 'website' },
  { key: 'phone', label: 'Phone', icon: Phone, color: 'text-amber-500', bgColor: 'bg-amber-500/10', filter: 'phone' },
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
    cxRisk: 0,
    hotLeads: 0,
    instagram: 0,
    email: 0,
    website: 0,
    phone: 0,
    pendingQuotes: 0
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
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch ALL conversations from the last 30 days (removed restrictive review_status filter)
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id, channel, subject, unread_count, priority, review_status, last_message_at, metadata, recipient_inbox")
        .gte("last_message_at", thirtyDaysAgo)
        .order("last_message_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("MightyChatCard query error:", error);
        throw error;
      }

      const convs = conversations || [];
      console.log(`[MightyChatCard] Loaded ${convs.length} conversations from last 30 days`);

      // Fetch pending AI actions (for hot leads and quote count)
      const { data: pendingActions } = await supabase
        .from("ai_actions")
        .select("id, action_type, priority, channel")
        .eq("resolved", false)
        .in("action_type", ["create_quote", "escalation", "auto_quote_generated", "file_review"]);

      // Calculate hot leads (urgent/high priority conversations that need attention)
      const hotLeadConversations = convs.filter(c => 
        (c.priority === 'urgent' || c.priority === 'high') && 
        (c.review_status === 'pending_review' || c.review_status === 'needs_response')
      ).length;
      const hotLeadActions = pendingActions?.filter(a => 
        a.action_type === 'escalation' || a.priority === 'urgent'
      ).length || 0;
      const hotLeads = hotLeadConversations + hotLeadActions;

      // Channel breakdown (only pending items)
      const channelCounts = {
        instagram: 0,
        email: 0,
        website: 0,
        phone: 0,
      };

      convs.forEach((conv) => {
        const channel = conv.channel?.toLowerCase() || "website";
        const inbox = conv.recipient_inbox?.toLowerCase() || "";
        
        if (channel.includes("instagram") || channel === "dm") {
          channelCounts.instagram++;
        } else if (channel.includes("email") || inbox.includes("hello") || inbox.includes("design") || inbox.includes("jackson")) {
          channelCounts.email++;
        } else if (channel.includes("phone") || channel.includes("sms")) {
          channelCounts.phone++;
        } else {
          channelCounts.website++;
        }
      });

      // Get pending review count (actual items needing human action)
      const pendingReviews = convs.filter(c => c.review_status === 'pending_review').length;
      
      // Get Ops Desk count
      const { count: opsCount } = await supabase
        .from("ai_actions")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false);

      // Pending quotes count
      const pendingQuotes = pendingActions?.filter(a => 
        a.action_type === 'create_quote' || a.action_type === 'auto_quote_generated'
      ).length || 0;

      setStats({
        websiteLeads: channelCounts.website,
        quotesWaiting: pendingQuotes,
        designReviews: 0,
        socialDMs: channelCounts.instagram,
        opsDesk: opsCount || 0,
        totalUnread: pendingReviews, // Now shows actual pending reviews, not stale unread counts
        highValue: hotLeads,
        cxRisk: 0,
        hotLeads,
        instagram: channelCounts.instagram,
        email: channelCounts.email,
        website: channelCounts.website,
        phone: channelCounts.phone,
        pendingQuotes
      });

      // Get top priority items for quick view
      const priorityItems = convs
        .filter(c => c.priority === 'urgent' || c.priority === 'high')
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

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Mighty</span>
            <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/mightychat-v2")}
            className="text-xs h-7 px-2"
          >
            Open Inbox
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Hot Leads Banner */}
        <div 
          className="flex items-center justify-between p-3 rounded-lg bg-background/50 cursor-pointer hover:bg-background/80 transition-colors"
          onClick={() => navigate("/mightychat-v2?filter=hot")}
        >
          <div className="flex items-center gap-2">
            {stats.hotLeads > 0 ? (
              <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1 px-2 py-1">
                <Flame className="w-3 h-3" />
                {stats.hotLeads} Hot Lead{stats.hotLeads !== 1 ? "s" : ""}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground flex items-center gap-1">
                <Flame className="w-3 h-3" />
                No hot leads
              </Badge>
            )}
          </div>
          {stats.hotLeads > 0 && (
            <span className="text-xs text-muted-foreground">Click to view</span>
          )}
        </div>

        {/* Channel Breakdown Grid */}
        <div className="grid grid-cols-4 gap-2">
          {CHANNEL_CARDS.map((channel) => {
            const Icon = channel.icon;
            const count = stats[channel.key as keyof WorkStreamStats] as number;
            return (
              <button
                key={channel.key}
                onClick={() => navigate(`/mightychat-v2?filter=${channel.filter}`)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className={`p-1.5 rounded-md ${channel.bgColor}`}>
                  <Icon className={`w-3.5 h-3.5 ${channel.color}`} />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {count}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {channel.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span className="flex items-center gap-1">
            <Bell className="w-3 h-3" />
            {stats.totalUnread || 0} pending reviews
          </span>
          <span className="flex items-center gap-1">
            📋 {stats.pendingQuotes || 0} quote requests
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
