import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Mail, MessageCircle, Globe, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BacklogItem {
  id: string;
  action_type: string;
  action_payload: {
    assigned_to?: string;
    conversation_id?: string;
    contact_id?: string;
    channel?: string;
    customer_name?: string;
    source_message_id?: string;
    source_message_excerpt?: string;
    notes?: string;
  };
  created_at: string;
  status: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
}

export default function Backlog() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchBacklog();
  }, []);

  const fetchBacklog = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_actions")
      .select("*")
      .eq("action_type", "create_task")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data as BacklogItem[]);
    }
    setLoading(false);
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "unassigned") return !item.action_payload?.assigned_to;
    return item.action_payload?.assigned_to?.toLowerCase() === filter.toLowerCase();
  });

  const pendingItems = filteredItems.filter((i) => !i.resolved);
  const resolvedItems = filteredItems.filter((i) => i.resolved);

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case "email": return <Mail className="w-4 h-4 text-emerald-500" />;
      case "instagram":
      case "facebook": return <MessageCircle className="w-4 h-4 text-pink-500" />;
      default: return <Globe className="w-4 h-4 text-blue-500" />;
    }
  };

  const openInMightyChat = (conversationId?: string) => {
    if (conversationId) {
      navigate(`/mightychat?id=${conversationId}`);
    }
  };

  const counts = {
    all: items.filter((i) => !i.resolved).length,
    lance: items.filter((i) => !i.resolved && i.action_payload?.assigned_to?.toLowerCase() === "lance").length,
    jackson: items.filter((i) => !i.resolved && i.action_payload?.assigned_to?.toLowerCase() === "jackson").length,
    unassigned: items.filter((i) => !i.resolved && !i.action_payload?.assigned_to).length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Backlog</h1>
            <p className="text-sm text-muted-foreground">
              Tasks created from conversations for Lance & Jackson
            </p>
          </div>
          <Button variant="outline" onClick={fetchBacklog}>
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">
              All <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="lance">
              Lance <Badge variant="secondary" className="ml-1">{counts.lance}</Badge>
            </TabsTrigger>
            <TabsTrigger value="jackson">
              Jackson <Badge variant="secondary" className="ml-1">{counts.jackson}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unassigned">
              Unassigned <Badge variant="secondary" className="ml-1">{counts.unassigned}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4 space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading backlog...</div>
            ) : pendingItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending backlog items for this filter.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <Card key={item.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Channel Icon */}
                        <div className="mt-1">
                          {getChannelIcon(item.action_payload?.channel)}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Customer & Assignee */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {item.action_payload?.customer_name || "Unknown Customer"}
                            </span>
                            {item.action_payload?.assigned_to && (
                              <Badge variant="outline" className="text-xs">
                                <User className="w-3 h-3 mr-1" />
                                {item.action_payload.assigned_to}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs capitalize">
                              {item.action_payload?.channel || "unknown"}
                            </Badge>
                          </div>

                          {/* Message Excerpt */}
                          {item.action_payload?.source_message_excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.action_payload.source_message_excerpt}
                            </p>
                          )}

                          {/* Notes */}
                          {item.action_payload?.notes && (
                            <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                              {item.action_payload.notes}
                            </p>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInMightyChat(item.action_payload?.conversation_id)}
                          disabled={!item.action_payload?.conversation_id}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Resolved Section */}
            {resolvedItems.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Resolved ({resolvedItems.length})
                </h3>
                <div className="space-y-2 opacity-60">
                  {resolvedItems.slice(0, 5).map((item) => (
                    <Card key={item.id} className="bg-muted/30">
                      <CardContent className="p-3 flex items-center gap-3">
                        {getChannelIcon(item.action_payload?.channel)}
                        <span className="text-sm">
                          {item.action_payload?.customer_name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Resolved {item.resolved_at ? formatDistanceToNow(new Date(item.resolved_at), { addSuffix: true }) : ""}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
