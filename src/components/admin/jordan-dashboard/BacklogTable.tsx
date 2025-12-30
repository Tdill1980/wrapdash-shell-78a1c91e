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
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface BacklogItem {
  id: string;
  channel: string;
  subject: string | null;
  last_inbound_at: string;
  last_outbound_at: string | null;
  needs_response: boolean;
  lastMessage?: string;
  lastMessageFull?: string;
}

export function BacklogTable() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const fetchBacklog = async () => {
    setLoading(true);
    try {
      // Query the ops_backlog_needs_response view
      const { data, error } = await supabase
        .from("ops_backlog_needs_response" as any)
        .select("*")
        .limit(100);

      if (error) throw error;
      
      const backlogItems = (data as unknown as BacklogItem[]) || [];
      
      // Fetch last inbound message for each conversation
      const itemsWithMessages = await Promise.all(
        backlogItems.map(async (item) => {
          const { data: msgData } = await supabase
            .from("messages")
            .select("content, raw_payload")
            .eq("conversation_id", item.id)
            .eq("direction", "inbound")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          let fullMessage = "";
          if (msgData?.content) {
            fullMessage = msgData.content;
          } else if (msgData?.raw_payload) {
            // Try to extract text from raw_payload for emails
            const payload = msgData.raw_payload as any;
            fullMessage = payload?.text || payload?.body || payload?.snippet || "";
          }
          
          return {
            ...item,
            lastMessage: fullMessage.substring(0, 100) + (fullMessage.length > 100 ? "..." : ""),
            lastMessageFull: fullMessage,
          };
        })
      );
      
      setItems(itemsWithMessages);
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

  const openInMightyChat = (conversationId: string) => {
    // Open conversation in MightyChat using the existing route
    window.open(`/mighty-chat?conversation=${conversationId}`, "_blank");
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
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Subject / Preview</TableHead>
            <TableHead>Age</TableHead>
            <TableHead className="w-[80px]">Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isExpanded = expandedRows.has(item.id);
            return (
              <>
                <TableRow key={item.id} className="cursor-pointer" onClick={() => toggleRow(item.id)}>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getChannelColor(item.channel)}>
                      {item.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="font-medium truncate">{item.subject || "—"}</div>
                    {item.lastMessage && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.lastMessage}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={`text-xs ${getAgeColor(item.last_inbound_at)}`}>
                    {formatDistanceToNow(new Date(item.last_inbound_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInMightyChat(item.id);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${item.id}-expanded`}>
                    <TableCell colSpan={5} className="bg-muted/30 p-4">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Last Inbound Message:</div>
                          <div className="text-sm bg-background p-3 rounded border border-border max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {item.lastMessageFull || "No message content available"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => openInMightyChat(item.id)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open in MightyChat
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
