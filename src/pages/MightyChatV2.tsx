import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Send, Pause, Play, Shield, Zap, MessageSquare, Mail, Globe, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ConversationStatusBadge } from "@/components/ConversationStatusBadge";

type Channel = "instagram" | "email" | "website" | "internal" | "all";

interface ConversationRow {
  id: string;
  channel: string;
  contact_id: string | null;
  subject: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  last_message_at: string | null;
  unread_count: number;
  ai_paused: boolean;
  approval_required: boolean;
  autopilot_allowed: boolean;
  organization_id: string | null;
  metadata: Record<string, unknown> | null;
  // Joined from contacts
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string | null;
  direction: string;
  channel: string;
  content: string;
  sender_name: string | null;
  sender_email: string | null;
  sender_type: string | null;
  status: string | null;
  sent_at: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
}

interface AIActionRow {
  id: string;
  conversation_id: string | null;
  status: string | null;
  channel: string | null;
  action_type: string | null;
  preview: string | null;
  action_payload: Record<string, unknown> | null;
  created_at: string | null;
}

interface ReceiptRow {
  id: string;
  conversation_id: string | null;
  channel: string;
  action_type: string;
  status: string;
  provider: string | null;
  provider_receipt_id: string | null;
  payload_snapshot: Record<string, unknown> | null;
  created_at: string;
  error: string | null;
}

function formatTime(ts?: string | null) {
  if (!ts) return "";
  try {
    return format(new Date(ts), "MMM d, h:mm a");
  } catch {
    return ts;
  }
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "instagram": return <MessageSquare className="h-4 w-4" />;
    case "email": return <Mail className="h-4 w-4" />;
    case "website": return <Globe className="h-4 w-4" />;
    default: return <Users className="h-4 w-4" />;
  }
}

function getSenderBadge(senderType?: string | null, direction?: string) {
  if (direction === "inbound") return { label: "Customer", variant: "outline" as const };
  if (senderType === "ai") return { label: "AI", variant: "secondary" as const };
  if (senderType === "human") return { label: "Human", variant: "default" as const };
  return { label: "System", variant: "outline" as const };
}

export default function MightyChatV2() {
  const [channel, setChannel] = useState<Channel>("all");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [pendingActions, setPendingActions] = useState<AIActionRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  // Load conversation list
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    
    let query = supabase
      .from("conversations")
      .select(`
        *,
        contacts(name, email, phone)
      `)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (channel !== "all") {
      query = query.eq("channel", channel);
    }

    if (search.trim()) {
      query = query.or(`subject.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.limit(200);
    
    if (error) {
      console.error("loadConversations error", error);
      setLoadingConversations(false);
      return;
    }

    const mapped = (data || []).map((c: any) => ({
      ...c,
      contact_name: c.contacts?.name || null,
      contact_email: c.contacts?.email || null,
      contact_phone: c.contacts?.phone || null,
    }));

    setConversations(mapped);
    
    if (!activeId && mapped.length > 0) {
      setActiveId(mapped[0].id);
    }
    
    setLoadingConversations(false);
  }, [channel, search, activeId]);

  useEffect(() => {
    loadConversations();
  }, [channel]);

  useEffect(() => {
    const t = setTimeout(() => loadConversations(), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load thread (messages + actions + receipts)
  const loadThread = useCallback(async (conversationId: string) => {
    setLoadingThread(true);

    const [messagesResult, actionsResult, receiptsResult] = await Promise.all([
      supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(500),
      supabase
        .from("ai_actions")
        .select("*")
        .eq("conversation_id", conversationId)
        .in("status", ["pending", "approved", "executing", "failed"])
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("execution_receipts")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (messagesResult.error) console.error("loadThread messages error", messagesResult.error);
    if (actionsResult.error) console.error("loadThread actions error", actionsResult.error);
    if (receiptsResult.error) console.error("loadThread receipts error", receiptsResult.error);

    setMessages((messagesResult.data as MessageRow[]) || []);
    setPendingActions((actionsResult.data as AIActionRow[]) || []);
    setReceipts((receiptsResult.data as ReceiptRow[]) || []);
    setLoadingThread(false);
  }, []);

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId, loadThread]);

  // Realtime subscriptions
  useEffect(() => {
    if (!activeId) return;

    const channelName = `mightychat-thread-${activeId}`;

    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
          loadConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "execution_receipts", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setReceipts((prev) => [payload.new as ReceiptRow, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_actions", filter: `conversation_id=eq.${activeId}` },
        () => {
          // Refresh actions on any change
          supabase
            .from("ai_actions")
            .select("*")
            .eq("conversation_id", activeId)
            .in("status", ["pending", "approved", "executing", "failed"])
            .order("created_at", { ascending: false })
            .limit(50)
            .then(({ data }) => setPendingActions((data as AIActionRow[]) || []));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [activeId, loadConversations]);

  // Save draft as message (human outbound)
  const saveDraftMessage = async () => {
    if (!activeId || !draft.trim()) return;
    const content = draft.trim();
    setDraft("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      direction: "outbound",
      channel: activeConversation?.channel || "internal",
      content,
      sender_type: "human",
      status: "draft",
    });

    if (error) console.error("saveDraftMessage error", error);
  };

  // Request send for approval (creates ai_action)
  const requestSendForApproval = async () => {
    if (!activeId || !draft.trim()) return;

    const content = draft.trim();
    const conv = activeConversation;
    if (!conv) return;

    setDraft("");

    const actionType = conv.channel === "instagram" ? "dm_send" 
      : conv.channel === "email" ? "email_send" 
      : "website_reply";

    const { error } = await supabase.from("ai_actions").insert({
      conversation_id: activeId,
      organization_id: conv.organization_id,
      status: "pending",
      channel: conv.channel,
      action_type: actionType,
      preview: content.slice(0, 140),
      action_payload: {
        conversation_id: activeId,
        channel: conv.channel,
        content,
      },
    });

    if (error) console.error("requestSendForApproval error", error);
  };

  // Update conversation settings
  const updateConversationPatch = async (patch: { ai_paused?: boolean; approval_required?: boolean; autopilot_allowed?: boolean }) => {
    if (!activeId) return;
    const { error } = await supabase.from("conversations").update(patch).eq("id", activeId);
    if (error) {
      console.error("updateConversationPatch error", error);
      return;
    }
    await loadConversations();
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full -m-4 sm:-m-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-xl font-bold">MightyChat v2 — Threaded Inbox</h1>
          <Button variant="outline" size="sm" onClick={loadConversations} disabled={loadingConversations}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loadingConversations && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 border-b bg-muted/30">
          <Tabs value={channel} onValueChange={(v) => setChannel(v as Channel)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="instagram">DMs</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="website">Website</TabsTrigger>
              <TabsTrigger value="internal">Internal</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Conversation list */}
          <div className="w-80 border-r bg-card flex flex-col">
            <div className="p-3 border-b">
              <span className="text-sm text-muted-foreground">
                Conversations ({conversations.length})
              </span>
            </div>
            <ScrollArea className="flex-1">
              {conversations.map((c) => {
                const title = c.contact_name || c.contact_email || c.subject || c.id.slice(0, 8);
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-full text-left p-3 border-b hover:bg-muted/40 transition-colors",
                      isActive && "bg-primary/10 border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate flex-1">{title}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {getChannelIcon(c.channel)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.subject || "(no subject)"}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(c.last_message_at)}
                      </span>
                      {c.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {c.unread_count}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </ScrollArea>
          </div>

          {/* Right: Active thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Thread header */}
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-semibold">
                    {activeConversation
                      ? (activeConversation.contact_name || activeConversation.contact_email || activeConversation.subject || activeConversation.id.slice(0, 8))
                      : "Select a conversation"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {activeConversation ? `Channel: ${activeConversation.channel}` : ""}
                  </p>
                </div>
                {activeConversation && (
                  <ConversationStatusBadge
                    aiPaused={activeConversation.ai_paused}
                    pendingActions={pendingActions}
                    receipts={receipts}
                  />
                )}
              </div>

              {activeConversation && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeConversation.ai_paused ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => updateConversationPatch({ ai_paused: !activeConversation.ai_paused })}
                  >
                    {activeConversation.ai_paused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                    {activeConversation.ai_paused ? "Resume AI" : "Pause AI"}
                  </Button>
                  <Button
                    variant={activeConversation.approval_required ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateConversationPatch({ approval_required: !activeConversation.approval_required })}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    {activeConversation.approval_required ? "Approval On" : "Approval Off"}
                  </Button>
                  <Button
                    variant={activeConversation.autopilot_allowed ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateConversationPatch({ autopilot_allowed: !activeConversation.autopilot_allowed })}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    {activeConversation.autopilot_allowed ? "Autopilot On" : "Autopilot Off"}
                  </Button>
                </div>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingThread && <p className="text-center text-muted-foreground">Loading thread...</p>}
              
              {!loadingThread && messages.length === 0 && (
                <p className="text-center text-muted-foreground">No messages found.</p>
              )}

              <div className="space-y-4">
                {messages.map((m) => {
                  const badge = getSenderBadge(m.sender_type, m.direction);
                  const isInbound = m.direction === "inbound";
                  
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        isInbound ? "items-start" : "items-end ml-auto"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {m.sender_name || m.sender_email || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(m.sent_at || m.created_at)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "p-3 rounded-lg",
                          isInbound ? "bg-muted" : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Pending actions & receipts */}
            <div className="border-t p-4 bg-muted/20">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm">Pending Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 max-h-32 overflow-y-auto">
                    {pendingActions.length === 0 && (
                      <p className="text-xs text-muted-foreground">No pending actions.</p>
                    )}
                    {pendingActions.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-1 border-b last:border-0">
                        <span className="text-xs font-medium">{a.action_type || "action"}</span>
                        <Badge variant="outline" className="text-xs">{a.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm">Execution Receipts</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 max-h-32 overflow-y-auto">
                    {receipts.length === 0 && (
                      <p className="text-xs text-muted-foreground">No receipts yet.</p>
                    )}
                    {receipts.map((r) => (
                      <div key={r.id} className="py-1 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{r.action_type}</span>
                          <Badge 
                            variant={r.status === "sent" ? "default" : r.status === "failed" ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {r.status}
                          </Badge>
                        </div>
                        {r.error && <p className="text-xs text-destructive">{r.error}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Composer */}
              <div className="flex gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] resize-none"
                />
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={saveDraftMessage}>
                    Save Note
                  </Button>
                  <Button size="sm" onClick={requestSendForApproval}>
                    <Send className="h-4 w-4 mr-1" />
                    Send for Approval
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                "Send for Approval" creates an ai_actions record. Your Ops Desk executes it and writes an execution_receipt when sent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
