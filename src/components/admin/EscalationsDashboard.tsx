import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  X,
  Link2,
  FileText,
  Truck,
  Palette,
  AlertCircle,
  ExternalLink,
  Copy
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { evaluateEscalationStatus, type EscalationStatus } from "@/hooks/useEscalationStatus";
import type { ConversationEvent } from "@/hooks/useConversationEvents";
import type { ChatConversation } from "@/hooks/useWebsiteChats";
import { toast } from "sonner";

// Priority order for escalation types (lower = higher priority)
const TYPE_PRIORITY: Record<string, number> = {
  'quality_issue': 1,
  'unhappy_customer': 2,
  'bulk_inquiry': 3,
  'bulk_inquiry_with_email': 3,
  'bulk_order': 3,
  'design': 4,
  'jackson': 5,
  'lance': 5,
  'general': 10,
};

// Escalation type display config
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'quality_issue': { label: 'Quality Issue', icon: AlertCircle, color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  'unhappy_customer': { label: 'Unhappy', icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  'bulk_inquiry': { label: 'Bulk Order', icon: Truck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  'bulk_inquiry_with_email': { label: 'Bulk Order', icon: Truck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  'bulk_order': { label: 'Bulk Order', icon: Truck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  'design': { label: 'Design', icon: Palette, color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  'jackson': { label: 'Jackson', icon: User, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  'lance': { label: 'Lance', icon: User, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
};

interface EscalationItem {
  conversationId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  escalationType: string;
  escalatedAt: string;
  status: EscalationStatus;
  missing: string[];
  age: string;
  priority: number;
}

interface Quote {
  id: string;
  quote_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_price: number | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
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
  
  // Quote attachment state
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  // Chat reply state
  const [chatReply, setChatReply] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Fetch escalation queue with priority sorting
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
        .select('id, contact:contacts(name, email, phone)')
        .in('id', conversationIds);

      const queueItems: EscalationItem[] = [];

      for (const convId of conversationIds) {
        const convEvents = (allEvents || []).filter(e => e.conversation_id === convId) as ConversationEvent[];
        const statusResult = evaluateEscalationStatus(convEvents);
        
        const conv = conversations?.find(c => c.id === convId);
        const escalation = escalationEvents?.find(e => e.conversation_id === convId);
        const contact = conv?.contact as { name?: string; email?: string; phone?: string } | null;
        const escalationType = escalation?.subtype || 'general';

        queueItems.push({
          conversationId: convId,
          contactName: contact?.name || 'Website Visitor',
          contactEmail: contact?.email || '',
          contactPhone: contact?.phone || '',
          escalationType,
          escalatedAt: escalation?.created_at || '',
          status: statusResult.status,
          missing: statusResult.missing,
          age: escalation?.created_at 
            ? formatDistanceToNow(new Date(escalation.created_at), { addSuffix: true })
            : '',
          priority: TYPE_PRIORITY[escalationType] || 10,
        });
      }

      // Sort by: 1) blocked first, 2) type priority, 3) age (oldest first)
      return queueItems.sort((a, b) => {
        // Blocked items first
        if (a.status === 'blocked' && b.status !== 'blocked') return -1;
        if (b.status === 'blocked' && a.status !== 'blocked') return 1;
        
        // Then by type priority
        if (a.priority !== b.priority) return a.priority - b.priority;
        
        // Then by age (oldest first)
        return new Date(a.escalatedAt).getTime() - new Date(b.escalatedAt).getTime();
      });
    },
    refetchInterval: 30000,
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

  // Fetch available quotes for attachment
  const { data: availableQuotes } = useQuery({
    queryKey: ['available-quotes'],
    queryFn: async (): Promise<Quote[]> => {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_number, customer_name, customer_email, customer_price, vehicle_year, vehicle_make, vehicle_model')
        .in('status', ['pending', 'lead', 'completed'])
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Quote[];
    },
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
    setChatReply("");
    setSelectedQuote(null);
  }, [selectedId]);

  const messages = conversation?.messages || [];
  const contact = conversation?.contact;
  const chatState = conversation?.chat_state;
  const hasEmail = contact?.email && !contact.email.includes('@capture.local');
  const hasPhone = !!contact?.phone;

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

Customer: ${contact?.name || 'Unknown'} (${contact?.email || 'no email'}, ${contact?.phone || 'no phone'})
${chatState?.vehicle ? `Vehicle: ${chatState.vehicle.year} ${chatState.vehicle.make} ${chatState.vehicle.model}` : ''}

Conversation:
${conversationContext}

${currentDraft ? `Admin's current draft:\n${currentDraft}\n` : ''}

Admin asks: ${userMessage}

Give concise, actionable advice. If they want you to write something, give exact text they can copy. If they ask for email, include a full email body. If they ask for contact info extraction, look for any email or phone in the conversation.`,
        },
      });

      if (error) throw error;

      if (data?.reply) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('No reply received');
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
    toast.success('Added to email reply!');
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
Email: ${contact?.email || 'unknown'}
Phone: ${contact?.phone || 'not provided'}
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
      console.error('Draft error:', err);
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
          subject: selectedQuote 
            ? `Your WePrintWraps Quote #${selectedQuote.quote_number}`
            : 'Re: Your WePrintWraps Inquiry',
          body: replyBody,
          quote_id: selectedQuote?.id,
        },
      });

      if (error) throw error;
      if (data?.success) {
        // Log the email sent event
        await supabase.from('conversation_events').insert([{
          conversation_id: selectedId,
          event_type: 'email_sent',
          actor: 'admin',
          payload: {
            email_sent_to: [contact!.email],
            email_subject: selectedQuote 
              ? `Your WePrintWraps Quote #${selectedQuote.quote_number}`
              : 'Re: Your WePrintWraps Inquiry',
            quote_attached: !!selectedQuote,
            quote_id: selectedQuote?.id,
          },
        }]);
        
        toast.success('Email sent!');
        setReplyBody("");
        setSelectedQuote(null);
        queryClient.invalidateQueries({ queryKey: ['escalations-dashboard-queue'] });
      }
    } catch (err) {
      console.error('Send error:', err);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Attach quote to conversation
  const handleAttachQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowQuoteDialog(false);
    
    // Log quote attached event
    supabase.from('conversation_events').insert([{
      conversation_id: selectedId,
      event_type: 'quote_attached',
      actor: 'admin',
      payload: {
        quote_id: quote.id,
        quote_number: quote.quote_number,
        customer_price: quote.customer_price,
      },
    }]);
    
    toast.success(`Quote #${quote.quote_number} attached!`);
    queryClient.invalidateQueries({ queryKey: ['escalations-dashboard-queue'] });
  };

  // Copy contact info
  const copyContactInfo = () => {
    const info = [
      contact?.name && `Name: ${contact.name}`,
      contact?.email && `Email: ${contact.email}`,
      contact?.phone && `Phone: ${contact.phone}`,
    ].filter(Boolean).join('\n');
    
    navigator.clipboard.writeText(info);
    toast.success('Contact info copied!');
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

  const getTypeConfig = (type: string) => {
    return TYPE_CONFIG[type] || { label: type, icon: MessageCircle, color: 'bg-muted text-muted-foreground border-muted' };
  };

  const blockedItems = items?.filter(i => i.status === 'blocked') || [];
  const completedItems = items?.filter(i => i.status === 'complete') || [];

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
                  {items.map((item) => {
                    const typeConfig = getTypeConfig(item.escalationType);
                    const TypeIcon = typeConfig.icon;
                    const isComplete = item.status === 'complete';
                    
                    return (
                      <button
                        key={item.conversationId}
                        onClick={() => setSelectedId(item.conversationId)}
                        className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                          selectedId === item.conversationId ? 'bg-primary/10 border-l-2 border-primary' : ''
                        } ${isComplete ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium truncate flex-1">{item.contactName}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${typeConfig.color} flex items-center gap-1`}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </div>
                        
                        {/* Contact info preview */}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-1.5">
                          {item.contactEmail && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              {item.contactEmail.split('@')[0]}...
                            </span>
                          )}
                          {item.contactPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-green-500" />
                              ✓
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.age}
                          {item.status === 'blocked' && (
                            <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 ml-auto">
                              blocked
                            </Badge>
                          )}
                          {isComplete && (
                            <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-400 ml-auto">
                              complete
                            </Badge>
                          )}
                        </div>
                        
                        {item.missing.length > 0 && !isComplete && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.missing.map((m, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] bg-red-500/5 text-red-400">
                                {m}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
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
                {/* Customer info bar - PROMINENT */}
                <div className="px-3 py-3 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">Contact Info</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs gap-1"
                      onClick={copyContactInfo}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {contact?.name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    )}
                    {hasEmail ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-green-500" />
                        <span>{contact!.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <Mail className="h-4 w-4" />
                        <span>No email captured</span>
                      </div>
                    )}
                    {hasPhone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{contact!.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-400">
                        <Phone className="h-4 w-4" />
                        <span>No phone captured</span>
                      </div>
                    )}
                    {chatState?.vehicle && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-blue-500" />
                        <span>{chatState.vehicle.year} {chatState.vehicle.make} {chatState.vehicle.model}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="h-[calc(100vh-450px)] p-3">
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
                  <ScrollArea className="h-[120px] border rounded-lg bg-muted/20 p-2" ref={scrollRef}>
                    {aiMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-xs py-4">
                        <p>e.g. "we need his email" or "draft a follow-up"</p>
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

                {/* Quote Attachment */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      Quote
                    </p>
                    <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
                          <Link2 className="h-3 w-3" />
                          Attach Quote
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Attach a Quote</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {availableQuotes?.map((quote) => (
                              <button
                                key={quote.id}
                                onClick={() => handleAttachQuote(quote)}
                                className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-sm font-medium">#{quote.quote_number}</span>
                                  <span className="text-sm font-bold text-green-500">
                                    ${quote.customer_price?.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {quote.customer_name || 'Unknown'} • {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {selectedQuote && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-400">Quote #{selectedQuote.quote_number} attached</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => setSelectedQuote(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-muted-foreground mt-1">
                        ${selectedQuote.customer_price?.toLocaleString()} • {selectedQuote.vehicle_year} {selectedQuote.vehicle_make}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Reply composer */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email Reply
                    </p>
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
                        className="min-h-[80px] text-sm resize-none"
                      />
                      <Button
                        className="w-full gap-2"
                        onClick={handleSendReply}
                        disabled={isSending || !replyBody.trim()}
                      >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send Email {selectedQuote && `+ Quote`}
                      </Button>
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
