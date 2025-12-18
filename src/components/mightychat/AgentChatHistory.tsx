import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MessageSquare, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AgentChat {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_role: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_sender: string | null;
  last_message_at: string;
}

interface AgentChatHistoryProps {
  onResumeChat: (chatId: string) => void;
}

export function AgentChatHistory({ onResumeChat }: AgentChatHistoryProps) {
  const [chats, setChats] = useState<AgentChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase.functions.invoke("agent-chat", {
        body: {
          action: "list",
          user_id: userId,
        },
      });

      if (error) throw error;
      setChats(data.chats || []);
    } catch (err) {
      console.error("Load chats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Get unique agents for filter
  const uniqueAgents = Array.from(
    new Map(chats.map(c => [c.agent_id, { id: c.agent_id, name: c.agent_name, role: c.agent_role }])).values()
  );

  // Filter chats
  const filteredChats = chats.filter(chat => {
    const matchesSearch = !searchQuery || 
      chat.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgent = !selectedAgent || chat.agent_id === selectedAgent;
    return matchesSearch && matchesAgent;
  });

  // Group by date
  const groupedChats = filteredChats.reduce((groups, chat) => {
    const date = new Date(chat.updated_at).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(chat);
    return groups;
  }, {} as Record<string, AgentChat[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delegated":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Delegated</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Ready</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">In Progress</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agent Chat History</h2>
          <Badge variant="outline">{chats.length} conversations</Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Agent Filter */}
        {uniqueAgents.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedAgent === null ? "default" : "outline"}
              onClick={() => setSelectedAgent(null)}
            >
              All Agents
            </Button>
            {uniqueAgents.map(agent => (
              <Button
                key={agent.id}
                size="sm"
                variant={selectedAgent === agent.id ? "default" : "outline"}
                onClick={() => setSelectedAgent(agent.id)}
              >
                {agent.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No agent conversations found</p>
            {searchQuery && (
              <Button variant="link" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {Object.entries(groupedChats).map(([date, dateChats]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
                <div className="space-y-2">
                  {dateChats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => onResumeChat(chat.id)}
                      className="w-full p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{chat.agent_name}</span>
                            <span className="text-xs text-muted-foreground">• {chat.agent_role}</span>
                            {getStatusBadge(chat.status)}
                          </div>
                          {chat.last_message && (
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.last_message_sender === "agent" ? `${chat.agent_name}: ` : "You: "}
                              {chat.last_message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
