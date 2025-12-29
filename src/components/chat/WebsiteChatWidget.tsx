import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Sparkles, Car, Palette, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

const QUICK_ACTIONS = [
  { icon: Car, label: "How much does a wrap cost?", message: "How much does a wrap cost?" },
  { icon: Package, label: "How do I order?", message: "How do I place an order?" },
  { icon: Palette, label: "Bulk / Fleet pricing", message: "I need bulk or fleet pricing" },
  { icon: Search, label: "Order status", message: "I want to check my order status" },
];

export function WebsiteChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `website-${crypto.randomUUID()}`);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hey! I'm Jordan with WePrintWraps.com. What can I help you with today?",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const { data, error } = await supabase.functions.invoke("luigi-ordering-concierge", {
        body: {
          org: "wpw",
          agent: "wpw_ai_team",
          mode: "live",
          session_id: sessionId,
          message_text: text,
          page_url: window.location.href,
        },
      });

      if (error) throw error;

      if (data?.reply || data?.message) {
        const fullContent = data.reply || data.message;
        const messageId = crypto.randomUUID();
        
        // Add empty message that will be typed out
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: "assistant",
            content: "",
            isTyping: true,
          },
        ]);
        setIsLoading(false);
        
        // Type out the message in chunks
        await typeMessage(messageId, fullContent);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
        },
      ]);
      setIsLoading(false);
    }
  };

  // Type message in natural chunks
  const typeMessage = async (messageId: string, fullContent: string) => {
    const words = fullContent.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const chunk = words.slice(i, i + chunkSize).join(' ');
      currentContent += (currentContent ? ' ' : '') + chunk;
      i += chunkSize - 1;
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: currentContent }
            : msg
        )
      );
      
      await new Promise((r) => setTimeout(r, 20 + Math.random() * 40));
    }
    
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, isTyping: false }
          : msg
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating bubble when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full",
          "bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]",
          "text-white shadow-2xl flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-[0_0_30px_rgba(131,58,180,0.5)]",
          "before:absolute before:inset-0 before:rounded-full",
          "before:bg-gradient-to-r before:from-[#405DE6] before:via-[#833AB4] before:to-[#E1306C]",
          "before:animate-ping before:opacity-30"
        )}
        style={{
          boxShadow: "0 4px 20px rgba(131, 58, 180, 0.4), 0 0 40px rgba(64, 93, 230, 0.2)"
        }}
      >
        <MessageCircle className="w-7 h-7 relative z-10" />
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-[380px] max-w-[calc(100vw-48px)]",
        "h-[520px] max-h-[calc(100vh-100px)]",
        "bg-card/95 backdrop-blur-xl",
        "border border-white/10 rounded-2xl",
        "shadow-2xl flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
      style={{
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(131, 58, 180, 0.15)"
      }}
    >
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] px-4 py-4">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#405DE6] to-[#E1306C] flex items-center justify-center ring-2 ring-white/30 text-lg font-bold text-white">
              J
            </div>
            <div>
              <span className="font-bold text-white block text-lg tracking-tight">Jordan</span>
              <span className="text-white/90 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                WPW Live Chat Agent • Online
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((message, index) => (
          <div 
            key={message.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                "max-w-[85%] px-4 py-3 rounded-2xl text-sm",
                "transition-all duration-200",
                message.role === "user"
                  ? "bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white ml-auto rounded-br-sm shadow-lg"
                  : "bg-white/5 border border-white/10 text-foreground rounded-bl-sm"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        {showQuickActions && messages.length === 1 && !isLoading && (
          <div className="grid grid-cols-2 gap-2 mt-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.message)}
                className={cn(
                  "flex items-center gap-2 p-3",
                  "bg-gradient-to-br from-white/5 to-white/[0.02]",
                  "hover:from-primary/20 hover:to-primary/10",
                  "rounded-xl text-sm font-medium",
                  "border border-white/10 hover:border-primary/30",
                  "transition-all duration-200 hover:scale-[1.02]",
                  "text-foreground/80 hover:text-primary"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 py-2 animate-in fade-in duration-200">
            <div className="flex gap-1 px-4 py-3 bg-white/5 rounded-2xl rounded-bl-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className={cn(
              "flex-1 bg-white/5 border border-white/10 rounded-full",
              "px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "transition-all duration-200"
            )}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={cn(
              "shrink-0 rounded-full w-10 h-10",
              "bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]",
              "hover:opacity-90 hover:scale-105",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:hover:scale-100"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
