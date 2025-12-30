import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface BacklogItem {
  id: string;
  channel: string;
  subject: string | null;
  last_inbound_at: string;
  last_outbound_at: string | null;
}

export function BacklogTable() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBacklog = async () => {
    setLoading(true);
    try {
      // Query conversations with last_message_at, ordered by most recent
      const { data, error } = await supabase
        .from("conversations")
        .select("id, channel, subject, last_message_at")
        .not("last_message_at", "is", null)
        .order("last_message_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Map to backlog items
      setItems(
        (data || []).map((c) => ({
          id: c.id,
          channel: c.channel,
          subject: c.subject,
          last_inbound_at: c.last_message_at || new Date().toISOString(),
          last_outbound_at: null,
        }))
      );
    } catch (e) {
      console.error("Failed to fetch backlog:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklog();
  }, []);

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "instagram":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "email":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "sms":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "website":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAgeColor = (dateStr: string) => {
    const hours = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
    if (hours > 48) return "text-red-400";
    if (hours > 24) return "text-yellow-400";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading backlog...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-green-400">
        No conversations need responses
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Last Inbound</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Badge variant="outline" className={getChannelColor(item.channel)}>
                  {item.channel}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {item.subject || "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(item.last_inbound_at).toLocaleString()}
              </TableCell>
              <TableCell className={`text-xs ${getAgeColor(item.last_inbound_at)}`}>
                {formatDistanceToNow(new Date(item.last_inbound_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
