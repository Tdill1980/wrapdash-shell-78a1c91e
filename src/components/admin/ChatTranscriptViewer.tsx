import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebsiteChats, useWebsiteChatStats } from "@/hooks/useWebsiteChats";
import { ChatTranscriptRow } from "./ChatTranscriptRow";
import { ChatDetailModal } from "./ChatDetailModal";
import { Search, MessageSquare, Mail, AlertCircle, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatConversation } from "@/hooks/useWebsiteChats";

export function ChatTranscriptViewer() {
  const { conversations, isLoading, refetch } = useWebsiteChats();
  const { data: stats } = useWebsiteChatStats();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [escalationFilter, setEscalationFilter] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter((convo) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesEmail = convo.contact?.email?.toLowerCase().includes(searchLower);
      const matchesName = convo.contact?.name?.toLowerCase().includes(searchLower);
      const matchesMessage = convo.messages?.some(m => 
        m.content?.toLowerCase().includes(searchLower)
      );
      if (!matchesEmail && !matchesName && !matchesMessage) return false;
    }

    // Status filter
    if (statusFilter !== "all" && convo.status !== statusFilter) return false;

    // Escalation filter
    if (escalationFilter !== "all") {
      const escalations = convo.chat_state?.escalations_sent || [];
      if (escalationFilter === "any" && escalations.length === 0) return false;
      if (escalationFilter !== "any" && !escalations.includes(escalationFilter)) return false;
    }

    return true;
  });

  const handleRowClick = (convo: ChatConversation) => {
    setSelectedConversation(convo);
    setModalOpen(true);
  };

  // Count escalations
  const escalationCount = conversations.filter(c => 
    (c.chat_state?.escalations_sent?.length || 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalToday || 0}</p>
                <p className="text-xs text-muted-foreground">Chats Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Mail className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.emailsCaptured || 0}</p>
                <p className="text-xs text-muted-foreground">Emails Captured</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{escalationCount}</p>
                <p className="text-xs text-muted-foreground">Escalations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeConversations || 0}</p>
                <p className="text-xs text-muted-foreground">Active Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat Transcripts</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Escalation filter */}
            <Select value={escalationFilter} onValueChange={setEscalationFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Escalations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chats</SelectItem>
                <SelectItem value="any">Has Escalation</SelectItem>
                <SelectItem value="jackson">Jackson</SelectItem>
                <SelectItem value="lance">Lance</SelectItem>
                <SelectItem value="design">Design</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversation list */}
          <div className="border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {conversations.length === 0 
                  ? "No chat conversations yet. Embed the widget to start receiving chats!"
                  : "No conversations match your filters."
                }
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                {filteredConversations.map((convo) => (
                  <ChatTranscriptRow
                    key={convo.id}
                    conversation={convo}
                    onClick={() => handleRowClick(convo)}
                    isSelected={selectedConversation?.id === convo.id}
                  />
                ))}
              </ScrollArea>
            )}
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredConversations.length} of {conversations.length} conversations
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <ChatDetailModal
        conversation={selectedConversation}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
