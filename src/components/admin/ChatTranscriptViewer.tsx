import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebsiteChats, useWebsiteChatStats, useConversationTotalCount } from "@/hooks/useWebsiteChats";
import { useEscalationStats } from "@/hooks/useConversationEvents";
import { ChatTranscriptRow } from "./ChatTranscriptRow";
import { ChatDetailModal } from "./ChatDetailModal";
import { Search, MessageSquare, Mail, AlertCircle, Users, RefreshCw, Calendar, Clock, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday } from "date-fns";
import type { ChatConversation } from "@/hooks/useWebsiteChats";

// Escalation type quick filters
const ESCALATION_QUICK_FILTERS = [
  { value: 'all', label: 'All', color: 'bg-muted' },
  { value: 'any', label: 'Has Escalation', color: 'bg-orange-500/10 text-orange-500' },
  { value: 'jackson', label: 'Jackson', color: 'bg-red-500/10 text-red-500' },
  { value: 'lance', label: 'Lance', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'design', label: 'Design', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'bulk', label: 'Bulk', color: 'bg-green-500/10 text-green-500' },
  { value: 'none', label: 'No Escalation', color: 'bg-muted text-muted-foreground' },
];

export function ChatTranscriptViewer() {
  const { conversations, isLoading, refetch } = useWebsiteChats();
  const { data: stats } = useWebsiteChatStats();
  const { data: totalDbCount } = useConversationTotalCount();
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [escalationFilter, setEscalationFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter conversations - ALL filters are optional UI controls, not defaults
  const filteredConversations = conversations.filter((convo) => {
    // Channel filter (optional - defaults to "all")
    if (channelFilter !== "all" && convo.channel !== channelFilter) {
      return false;
    }

    // Today filter (optional - defaults to false)
    if (todayOnly && convo.created_at && !isToday(new Date(convo.created_at))) {
      return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesEmail = convo.contact?.email?.toLowerCase().includes(searchLower);
      const matchesName = convo.contact?.name?.toLowerCase().includes(searchLower);
      const matchesMessage = convo.messages?.some(m => 
        m.content?.toLowerCase().includes(searchLower)
      );
      const matchesLocation = convo.metadata?.geo?.city?.toLowerCase().includes(searchLower) ||
        convo.metadata?.geo?.region?.toLowerCase().includes(searchLower);
      if (!matchesEmail && !matchesName && !matchesMessage && !matchesLocation) return false;
    }

    // Status filter
    if (statusFilter !== "all" && convo.status !== statusFilter) return false;

    // Escalation filter
    if (escalationFilter !== "all") {
      const escalations = convo.chat_state?.escalations_sent || [];
      if (escalationFilter === "none" && escalations.length > 0) return false;
      if (escalationFilter === "any" && escalations.length === 0) return false;
      if (!['any', 'none'].includes(escalationFilter) && !escalations.includes(escalationFilter)) return false;
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

  // Escalation stats from events table
  const { data: escalationStats } = useEscalationStats();

  // Get selected conversation details for right panel
  const selectedGeo = selectedConversation?.metadata?.geo;
  const selectedMessages = selectedConversation?.messages || [];

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
                <p className="text-xs text-muted-foreground">Website Chats Today</p>
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
                <p className="text-2xl font-bold">{escalationStats?.total || escalationCount}</p>
                <p className="text-xs text-muted-foreground">
                  Escalations ({escalationStats?.today || 0} today)
                </p>
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
                <p className="text-xs text-muted-foreground">Website Chats Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escalation Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Zap className="h-4 w-4" />
          Escalations:
        </span>
        {ESCALATION_QUICK_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={escalationFilter === filter.value ? "default" : "outline"}
            size="sm"
            className={escalationFilter === filter.value ? "" : filter.color}
            onClick={() => setEscalationFilter(filter.value)}
          >
            {filter.label}
            {filter.value !== 'all' && filter.value !== 'none' && escalationStats?.byType?.[filter.value] && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {escalationStats.byType[filter.value]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Session List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All Conversations</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant={todayOnly ? "default" : "outline"} 
                size="sm"
                onClick={() => setTodayOnly(!todayOnly)}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Today Only
              </Button>
              <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* OS Transparency: Total DB count badge */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg border">
            <Badge variant="outline" className="text-sm font-mono">
              DB Total: {totalDbCount ?? '...'}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Loaded: {conversations.length}
            </Badge>
            <Badge variant={filteredConversations.length === conversations.length ? "default" : "destructive"} className="text-sm">
              Showing: {filteredConversations.length}
            </Badge>
            {filteredConversations.length < conversations.length && (
              <span className="text-xs text-muted-foreground">
                (filters active)
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-3">Conversations</h3>

          {/* Filters - ALL optional, no defaults hide data */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

          </div>

          {/* Session List */}
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading sessions...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              {conversations.length === 0 
                ? "No chat sessions yet. Embed the widget to start receiving chats!"
                : "No sessions match your filters."
              }
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
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

        {/* Right: Session Details Panel */}
        <Card className="bg-card/50 h-fit">
          <CardContent className="pt-6">
            {selectedConversation ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Session Details</h3>
                
                {/* Customer Info */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Customer:</span>{" "}
                    <span className="font-medium">
                      {selectedConversation.contact?.email || selectedConversation.contact?.name || "Anonymous"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Started:</span>{" "}
                    {selectedConversation.created_at && format(new Date(selectedConversation.created_at), 'PPpp')}
                  </p>
                  {selectedGeo && (
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">Location:</span>{" "}
                      <span className="text-primary">
                        {selectedGeo.city}, {selectedGeo.region} ({selectedGeo.country})
                      </span>
                    </p>
                  )}
                </div>

                {/* Vehicle Info */}
                {selectedConversation.chat_state?.vehicle && (
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-sm font-medium text-blue-500">Vehicle Interest</p>
                    <p className="text-sm">
                      {selectedConversation.chat_state.vehicle.year} {selectedConversation.chat_state.vehicle.make} {selectedConversation.chat_state.vehicle.model}
                    </p>
                  </div>
                )}

                {/* Transcript */}
                <div>
                  <h4 className="font-medium mb-2">Transcript ({selectedMessages.length} messages)</h4>
                  <ScrollArea className="h-[300px] border rounded-lg p-3">
                    {selectedMessages.map((msg, idx) => (
                      <div key={msg.id || idx} className={`mb-3 ${msg.direction === 'outbound' ? 'text-right' : ''}`}>
                        <div className={`inline-block max-w-[80%] p-2 rounded-lg text-sm ${
                          msg.direction === 'outbound' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {msg.content}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {msg.sender_name || (msg.direction === 'outbound' ? 'Jordan Lee' : 'Customer')}
                          {msg.created_at && ` • ${format(new Date(msg.created_at), 'h:mm a')}`}
                        </p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Select a session to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal (for full screen view) */}
      <ChatDetailModal
        conversation={selectedConversation}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
