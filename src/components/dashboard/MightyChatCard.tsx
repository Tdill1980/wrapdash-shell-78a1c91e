import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  ArrowRight, 
  Bell,
  Flame,
  Phone,
  Globe,
  FileCheck
} from "lucide-react";

interface WorkStreamStats {
  website: number;
  phone: number;
  fileReviews: number;
  hotLeads: number;
  pendingQuotes: number;
}

const CHANNEL_CARDS = [
  { 
    key: 'website', 
    label: 'Website Chat', 
    icon: Globe, 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-500/10', 
    route: '/website-admin' 
  },
  { 
    key: 'phone', 
    label: 'Phone Agent', 
    icon: Phone, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10', 
    route: '/website-admin?tab=phone' 
  },
  { 
    key: 'fileReviews', 
    label: 'File Reviews', 
    icon: FileCheck, 
    color: 'text-pink-500', 
    bgColor: 'bg-pink-500/10', 
    route: '/website-admin?tab=artwork' 
  },
] as const;

export function MightyChatCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<WorkStreamStats>({
    website: 0,
    phone: 0,
    fileReviews: 0,
    hotLeads: 0,
    pendingQuotes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkStreams();

    const channel = supabase
      .channel('mightychat-dashboard-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadWorkStreams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'phone_calls' }, () => loadWorkStreams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_actions' }, () => loadWorkStreams())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadWorkStreams() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Parallel queries for real data
      const [websiteResult, phoneResult, fileReviewsResult, hotLeadsResult, pendingQuotesResult] = await Promise.all([
        // Website chat conversations
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .or("channel.eq.website,channel.eq.website_chat")
          .gte("last_message_at", thirtyDaysAgo),
        
        // Phone calls from VAPI
        supabase
          .from("phone_calls")
          .select("id", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo),
        
        // Pending file reviews
        supabase
          .from("ai_actions")
          .select("id", { count: "exact", head: true })
          .eq("resolved", false)
          .eq("action_type", "file_review"),
        
        // Hot leads (urgent phone calls + escalated conversations)
        supabase
          .from("phone_calls")
          .select("id", { count: "exact", head: true })
          .eq("is_hot_lead", true)
          .gte("created_at", thirtyDaysAgo),
        
        // Pending quotes
        supabase
          .from("ai_actions")
          .select("id", { count: "exact", head: true })
          .eq("resolved", false)
          .in("action_type", ["create_quote", "auto_quote_generated"])
      ]);

      // Also count escalated conversations as hot leads
      const { count: escalatedCount } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("escalated", true)
        .gte("last_message_at", thirtyDaysAgo);

      const hotLeadsTotal = (hotLeadsResult.count || 0) + (escalatedCount || 0);

      setStats({
        website: websiteResult.count || 0,
        phone: phoneResult.count || 0,
        fileReviews: fileReviewsResult.count || 0,
        hotLeads: hotLeadsTotal,
        pendingQuotes: pendingQuotesResult.count || 0
      });

      console.log(`[MightyChatCard] Website: ${websiteResult.count}, Phone: ${phoneResult.count}, File Reviews: ${fileReviewsResult.count}, Hot Leads: ${hotLeadsTotal}`);
    } catch (err) {
      console.error("Error loading work streams:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-semibold">
              <span className="text-white">Mighty</span>
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">Chat</span>
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/website-admin")}
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
          onClick={() => navigate("/website-admin?filter=hot")}
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

        {/* Channel Breakdown Grid - 3 columns */}
        <div className="grid grid-cols-3 gap-3">
          {CHANNEL_CARDS.map((channel) => {
            const Icon = channel.icon;
            const count = stats[channel.key as keyof WorkStreamStats] as number;
            return (
              <button
                key={channel.key}
                onClick={() => navigate(channel.route)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className={`p-2 rounded-md ${channel.bgColor}`}>
                  <Icon className={`w-4 h-4 ${channel.color}`} />
                </div>
                <span className="text-xl font-semibold text-foreground">
                  {loading ? "..." : count}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {channel.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
          <span className="flex items-center gap-1">
            <Bell className="w-3 h-3" />
            {stats.pendingQuotes} quote requests
          </span>
          <span className="flex items-center gap-1">
            💬 Real-time conversations
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
