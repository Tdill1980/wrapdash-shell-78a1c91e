import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { supabase, lovableFunctions } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AffiliateSupportChatProps {
  founderId: string;
  founderName: string;
}

export const AffiliateSupportChat = ({ founderId, founderName }: AffiliateSupportChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey ${founderName.split(' ')[0]}! 👋 I'm Evan Porter, your dedicated Affiliate Operations manager. I'm here to help you maximize your earnings, answer questions about commissions, content uploads, or anything else affiliate-related. What can I help you with today?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await lovableFunctions.functions.invoke('affiliate-support-chat', {
        body: {
          founderId,
          founderName,
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm having trouble processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Connection issue",
        description: "Evan is temporarily unavailable. Please try again shortly.",
        variant: "destructive",
      });
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm experiencing a brief connection issue. Your message has been noted. In the meantime, feel free to check out your dashboard stats or upload new content!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[600px] bg-[#16161E] border-[#ffffff0f]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#ffffff0f]">
        <div className="relative">
          <Avatar className="h-10 w-10 bg-gradient-to-br from-red-500 to-pink-500">
            <AvatarFallback className="bg-transparent text-white font-semibold">EP</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#16161E]" />
        </div>
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            Evan Porter
            <Sparkles className="w-4 h-4 text-red-400" />
          </h3>
          <p className="text-xs text-muted-foreground">Affiliate Operations AI</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className={`h-8 w-8 ${message.role === 'assistant' ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-[#00AFFF]'}`}>
                <AvatarFallback className="bg-transparent text-white text-xs">
                  {message.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white'
                    : 'bg-[#1a1a2e] text-white border border-[#ffffff0f]'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-gradient-to-br from-red-500 to-pink-500">
                <AvatarFallback className="bg-transparent text-white text-xs">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-[#1a1a2e] rounded-2xl px-4 py-3 border border-[#ffffff0f]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-[#ffffff0f]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Evan about commissions, content, payouts..."
            className="flex-1 bg-[#0A0A0F] border-[#ffffff0f] text-white placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Evan Porter • AI Affiliate Operations Manager
        </p>
      </div>
    </Card>
  );
};
