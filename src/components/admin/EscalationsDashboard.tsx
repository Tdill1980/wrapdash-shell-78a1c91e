import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  Clock, 
  Mail, 
  Receipt, 
  FileCheck,
  User,
  Send,
  Bot,
  Loader2,
  CheckCircle,
  Sparkles,
  MessageCircle,
  Car,
  Phone,
  X
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { evaluateEscalationStatus, type EscalationStatus } from "@/hooks/useEscalationStatus";
import type { ConversationEvent } from "@/hooks/useConversationEvents";
import type { ChatConversation } from "@/hooks/useWebsiteChats";
import { toast } from "sonner";

interface EscalationItem {
  conversationId: string;
  contactName: string;
  contactEmail: string;
  escalationType: string;
  escalatedAt: string;
  status: EscalationStatus;
  missing: string[];
  age: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function EscalationsDashboard() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Reply state
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch escalation queue
  const { data: items, isLoading: queueLoading } = useQuery({
    queryKey: ['escalations-dashboard-queue'],
    queryFn: async (): Promise<EscalationItem[]> => {
      const { data: escalationEvents, error: eventsError } = await supabase
        .from('conversation_events')
        .select('conversation_id, created_at, subtype')
        .eq('event_type', 'escalation_sent')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const conversationIds = [...new Set(escalationEvents?.map(e => e.conversation_id) || [])];
      if (conversationIds.length === 0) return [];

      const { data: allEvents } = await supabase
        .from('conversation_events')
        .select('*')
        .in('conversation_id', conversationIds);

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, contact:contacts(name, email)')
        .in('id', conversationIds);

      const queueItems: EscalationItem[] = [];

      for (const convId of conversationIds) {
        const convEvents = (allEvents || []).filter(e => e.conversation_id === convId) as ConversationEvent[];
        const statusResult = evaluateEscalationStatus(convEvents);
        
        const conv = conversations?.find(c => c.id === convId);
        const escalation = escalationEvents?.find(e => e.conversation_id === convId);
        const contact = conv?.contact as { name?: string; email?: string } | null;

        queueItems.push({
          conversationId: convId,
          contactName: contact?.name || 'Unknown',
          contactEmail: contact?.email || '',
          escalationType: escalation?.subtype || 'general',
          escalatedAt: escalation?.created_at || '',
          status: statusResult.status,
          missing: statusResult.missing,
          age: escalation?.created_at 
            ? formatDistanceToNow(new Date(escalation.created_at), { addSuffix: true })
            : '',
        });
      }

      return queueItems.sort((a, b) => 
        new Date(a.escalatedAt).getTime() - new Date(b.escalatedAt).getTime()
      );
    },
    refetchInterval: 60000,
  });

  // Fetch selected conversation
  const { data: conversation, isLoading: convLoading } = useQuery({
    queryKey: ['escalation-conversation', selectedId],
    queryFn: async (): Promise<ChatConversation | null> => {
      if (!selectedId) return null;

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(*),
          messages:messages(*)
        `)
        .eq('id', selectedId)
        .single();

      if (error) throw error;
      return data as ChatConversation;
    },
    enabled: !!selectedId,
  });

  // Scroll AI chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  // Reset state when selecting new conversation
  useEffect(() => {
    setAiMessages([]);
    setAiInput("");
    setReplyBody("");
  }, [selectedId]);

  const messages = conversation?.messages || [];
  const contact = conversation?.contact;
  const chatState = conversation?.chat_state;
  const hasEmail = contact?.email && !contact.email.includes('@capture.local');

  const getConversationContext = () => {
    return messages
      .slice(-15)
      .map((msg) => `${msg.direction === 'inbound' ? 'Customer' : 'Jordan'}: ${msg.content}`)
      .join('\n');
  };

  // Ask Jordan AI
  const handleAskJordan = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiThinking(true);

    try {
      const conversationContext = getConversationContext();
      const currentDraft = replyBody.trim();

      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          agent: 'jordan_lee',
          prompt: `You are Jordan Lee, a friendly wrap specialist helping an admin respond to a customer.

Customer: ${contact?.name || 'Unknown'} (${contact?.email || 'no email'})
${chatState?.vehicle ? `Vehicle: ${chatState.vehicle.year} ${chatState.vehicle.make} ${chatState.vehicle.model}` : ''}

Conversation:
${conversationContext}

${currentDraft ? `Admin's current draft:\n${currentDraft}\n` : ''}

Admin asks: ${userMessage}

Give concise, actionable advice. If they want you to write something, give exact text they can copy.`,
        },
      });

      if (error) throw error;

      if (data?.reply) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      console.error('AI error:', err);
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, had trouble with that. Try again.' }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Use AI text in reply
  const useInReply = (text: string) => {
    setReplyBody(text);
    toast.success('Added to reply!');
  };

  // Generate AI draft
  const handleAIDraft = async () => {
    setIsAiThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          agent: 'jordan_lee',
          prompt: `Write a professional email reply to this customer.

Customer: ${contact?.name || 'Valued Customer'}
Conversation:
${getConversationContext()}

Write 2-3 short paragraphs. Be helpful and warm. Sign off as "The WePrintWraps Team". Body only, no subject.`,
        },
      });

      if (error) throw error;
      if (data?.reply) {
        setReplyBody(data.reply);
        toast.success('Draft ready!');
      }
    } catch (err) {
      toast.error('Failed to generate draft');
    } finally {
      setIsAiThinking(false);
    }
  };

  // Send email reply
  const handleSendReply = async () => {
    if (!hasEmail || !replyBody.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-reply', {
        body: {
          conversation_id: selectedId,
          to_email: contact!.email,
          to_name: contact?.name || undefined,
          subject: 'Re: Your WePrintWraps Inquiry',
          body: replyBody,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success('Email sent!');
        setReplyBody("");
        queryClient.invalidateQueries({ queryKey: ['escalations-dashboard-queue'] });
      }
    } catch (err) {
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Mark escalation complete
  const handleMarkComplete = async () => {
    if (!selectedId) return;
    setIsProcessing(true);
    try {
      await supabase.from('conversation_events').insert([{
        conversation_id: selectedId,
        event_type: 'marked_complete',
        actor: 'admin',
        payload: { resolution_notes: 'Marked complete by admin' },
      }]);
      toast.success('Marked complete!');
      queryClient.invalidateQueries({ queryKey: ['escalations-dashboard-queue'] });
      setSelectedId(null);
    } catch (err) {
      toast.error('Failed to mark complete');
    } finally {
      setIsProcessing(false);
    }
  };

  const blockedItems = items?.filter(i => i.status === 'blocked') || [];
  const otherItems = items?.filter(i => i.status !== 'blocked') || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        Escalations Dashboard
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Escalation Queue */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Queue</span>
              {blockedItems.length > 0 && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                  {blockedItems.length} blocked
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {queueLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
            ) : !items || items.length === 0 ? (
              <div className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All clear! No escalations.</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="divide-y divide-border">
                  {/* Blocked first */}
                  {blockedItems.map((item) => (
                    <button
                      key={item.conversationId}
                      onClick={() => setSelectedId(item.conversationId)}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedId === item.conversationId ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{item.contactName}</span>
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500">
                          blocked
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.age}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.missing.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] bg-red-500/5 text-red-400">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                  {/* Then others */}
                  {otherItems.map((item) => (
                    <button
                      key={item.conversationId}
                      onClick={() => setSelectedId(item.conversationId)}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors opacity-60 ${
                        selectedId === item.conversationId ? 'bg-primary/10 border-l-2 border-primary opacity-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{item.contactName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{item.age}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Middle: Full Transcript */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Full Transcript</span>
              {conversation && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedId ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select an escalation to view transcript</p>
              </div>
            ) : convLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : (
              <>
                {/* Customer info bar */}
                <div className="px-3 py-2 border-b bg-muted/30 text-xs space-y-1">
                  {contact?.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="font-medium">{contact.name}</span>
                    </div>
                  )}
                  {hasEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{contact!.email}</span>
                    </div>
                  )}
                  {contact?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {chatState?.vehicle && (
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3" />
                      <span>{chatState.vehicle.year} {chatState.vehicle.make} {chatState.vehicle.model}</span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="h-[calc(100vh-380px)] p-3">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-4">No messages</p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-lg p-2.5 text-sm ${
                              msg.direction === 'inbound'
                                ? 'bg-muted'
                                : 'bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                              <span>{msg.sender_name || (msg.direction === 'inbound' ? 'Customer' : 'Jordan')}</span>
                              {msg.created_at && (
                                <span>{format(new Date(msg.created_at), 'h:mm a')}</span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: AI Chat + Reply */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Ask Jordan & Reply
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedId ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select an escalation first</p>
              </div>
            ) : (
              <>
                {/* AI Chat */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Ask Jordan for advice on how to respond:</p>
                  <ScrollArea className="h-[140px] border rounded-lg bg-muted/20 p-2" ref={scrollRef}>
                    {aiMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-xs py-4">
                        <p>e.g. "How should I respond?" or "Rephrase professionally"</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {aiMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.role === 'assistant' && (
                              <Bot className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                            )}
                            <div
                              className={`max-w-[85%] rounded-lg p-2 text-xs ${
                                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              {msg.role === 'assistant' && msg.content.length > 30 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 h-5 text-[10px] gap-1 px-1"
                                  onClick={() => useInReply(msg.content)}
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Use
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {isAiThinking && (
                          <div className="flex gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ask Jordan..."
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAskJordan();
                        }
                      }}
                      disabled={isAiThinking}
                    />
                    <Button size="icon" onClick={handleAskJordan} disabled={isAiThinking || !aiInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Reply composer */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Email Reply</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={handleAIDraft}
                      disabled={isAiThinking}
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Draft
                    </Button>
                  </div>
                  
                  {hasEmail ? (
                    <>
                      <Textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Type your reply..."
                        className="min-h-[100px] text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-2"
                          onClick={handleSendReply}
                          disabled={isSending || !replyBody.trim()}
                        >
                          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Send to {contact?.email}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3 text-center">
                      <Mail className="h-4 w-4 mx-auto mb-1 opacity-50" />
                      No email captured yet
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleMarkComplete}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Mark Complete
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}