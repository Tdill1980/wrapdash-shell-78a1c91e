import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

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
  const { organizationId } = useOrganization();
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const fetchChannelStatus = async () => {
      try {
        // Query conversations grouped by channel and recipient_inbox
        const { data, error } = await supabase
          .from('conversations')
          .select('channel, recipient_inbox, created_at')
          .eq('organization_id', organizationId);

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
            connected: (websiteStats?.count || 0) > 0, // Assume connected if has messages
            lastMessageAt: formatLastMessage(websiteStats?.lastMessage || null),
            messageCount: websiteStats?.count || 0,
            status: getStatus(websiteStats, true),
            notes: websiteStats?.count ? undefined : "Widget may not be deployed on website",
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
            notes: helloStats?.count ? undefined : "Power Automate webhook may not be firing",
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
          },
          {
            id: "instagram",
            label: "Instagram DMs",
            owner: "Casey Ramirez",
            ownerRole: "Social Agent",
            icon: "📸",
            connected: (instagramStats?.count || 0) > 0,
            lastMessageAt: formatLastMessage(instagramStats?.lastMessage || null),
            messageCount: instagramStats?.count || 0,
            status: getStatus(instagramStats, (instagramStats?.count || 0) > 0),
            notes: instagramStats?.count ? undefined : "Instagram webhook not receiving messages",
          },
          {
            id: "facebook",
            label: "Facebook Messages",
            owner: "Casey Ramirez",
            ownerRole: "Social Agent",
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

    // Refresh every 60 seconds
    const interval = setInterval(fetchChannelStatus, 60000);
    return () => clearInterval(interval);
  }, [organizationId]);

  return { channels, loading };
}
