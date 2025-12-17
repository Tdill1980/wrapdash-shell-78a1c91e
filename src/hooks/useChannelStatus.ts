import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChannelStatus {
  id: string;
  label: string;
  owner: string;
  ownerRole: string;
  icon: string;
  connected: boolean;
  lastMessageAt: string | null;
  messageCount: number;
  status: "live" | "stale" | "empty" | "not_connected";
  notes?: string;
}

interface ChannelQueryResult {
  channel: string;
  recipient_inbox: string | null;
  count: number;
  last_message: string | null;
}

export function useChannelStatus() {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannelStatus = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const isSignedIn = !!sessionData.session;

        // Pull last 48h for the status panel (if not signed in, this will likely only show public channels)
        const { data, error } = await supabase
          .from('conversations')
          .select('channel, recipient_inbox, created_at')
          .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

        if (error) {
          console.error('Error fetching channel status:', error);
          return;
        }

        // Process data to get counts and last message per channel/inbox
        const channelStats: Record<string, { count: number; lastMessage: string | null }> = {};
        
        (data || []).forEach((conv) => {
          const key = conv.channel === 'email' 
            ? `email_${conv.recipient_inbox || 'general'}`
            : conv.channel;
          
          if (!channelStats[key]) {
            channelStats[key] = { count: 0, lastMessage: null };
          }
          channelStats[key].count++;
          
          if (!channelStats[key].lastMessage || 
              new Date(conv.created_at) > new Date(channelStats[key].lastMessage)) {
            channelStats[key].lastMessage = conv.created_at;
          }
        });

        // Build channel status list
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const getStatus = (stats: { count: number; lastMessage: string | null } | undefined, isConnected: boolean): ChannelStatus["status"] => {
          if (!isConnected) return "not_connected";
          if (!stats || stats.count === 0) return "empty";
          if (stats.lastMessage && new Date(stats.lastMessage) > oneDayAgo) return "live";
          return "stale";
        };

        const formatLastMessage = (date: string | null): string | null => {
          if (!date) return null;
          const d = new Date(date);
          const diff = now.getTime() - d.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const days = Math.floor(hours / 24);
          
          if (hours < 1) return "Just now";
          if (hours < 24) return `${hours}h ago`;
          if (days === 1) return "Yesterday";
          return `${days} days ago`;
        };

        // Define all channels with their owners
        const websiteStats = channelStats['website'];
        const helloStats = channelStats['email_hello'];
        const designStats = channelStats['email_design'];
        const jacksonStats = channelStats['email_jackson'];
        const instagramStats = channelStats['instagram'];
        const facebookStats = channelStats['facebook'];

        const channelList: ChannelStatus[] = [
          {
            id: "website",
            label: "Website Chat",
            owner: "Jordan Lee",
            ownerRole: "Sales Agent",
            icon: "🌐",
            connected: (websiteStats?.count || 0) > 0,
            lastMessageAt: formatLastMessage(websiteStats?.lastMessage || null),
            messageCount: websiteStats?.count || 0,
            status: getStatus(websiteStats, true),
            notes: websiteStats?.count ? undefined : "No website chats in last 48h",
          },
          {
            id: "hello_email",
            label: "hello@weprintwraps.com",
            owner: "Alex Morgan",
            ownerRole: "Quotes Agent",
            icon: "📧",
            connected: (helloStats?.count || 0) > 0,
            lastMessageAt: formatLastMessage(helloStats?.lastMessage || null),
            messageCount: helloStats?.count || 0,
            status: getStatus(helloStats, true),
            notes: helloStats?.count ? undefined : (isSignedIn ? "No hello@ emails in last 48h" : "Sign in to view email inboxes"),
          },
          {
            id: "design_email",
            label: "design@weprintwraps.com",
            owner: "Grant Miller",
            ownerRole: "Design Agent",
            icon: "🎨",
            connected: (designStats?.count || 0) > 0,
            lastMessageAt: formatLastMessage(designStats?.lastMessage || null),
            messageCount: designStats?.count || 0,
            status: getStatus(designStats, true),
            notes: designStats?.count ? undefined : (isSignedIn ? "No design@ emails in last 48h" : "Sign in to view email inboxes"),
          },
          {
            id: "jackson_email",
            label: "jackson@weprintwraps.com",
            owner: "Ops Desk",
            ownerRole: "Operations",
            icon: "📨",
            connected: (jacksonStats?.count || 0) > 0,
            lastMessageAt: formatLastMessage(jacksonStats?.lastMessage || null),
            messageCount: jacksonStats?.count || 0,
            status: getStatus(jacksonStats, true),
            notes: jacksonStats?.count ? undefined : (isSignedIn ? "No jackson@ emails in last 48h" : "Sign in to view email inboxes"),
          },
          {
            id: "instagram",
            label: "Instagram DMs",
            owner: "Social Team",
            ownerRole: "Social Media",
            icon: "📸",
            connected: (instagramStats?.count || 0) > 0,
            lastMessageAt: formatLastMessage(instagramStats?.lastMessage || null),
            messageCount: instagramStats?.count || 0,
            status: getStatus(instagramStats, true),
            notes: instagramStats?.count ? undefined : "No Instagram DMs in last 48h",
          },
          {
            id: "facebook",
            label: "Facebook Messages",
            owner: "Social Team",
            ownerRole: "Social Media",
            icon: "📘",
            connected: false, // Facebook is explicitly not connected
            lastMessageAt: null,
            messageCount: facebookStats?.count || 0,
            status: "not_connected",
            notes: "Meta Messenger permissions required",
          },
        ];

        setChannels(channelList);
      } catch (error) {
        console.error('Failed to fetch channel status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchChannelStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { channels, loading };
}
