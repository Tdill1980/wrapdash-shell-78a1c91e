import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, X, Send, DollarSign, 
  Package, HelpCircle, Mail, Truck, Users, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

// Reordered for sales focus - pricing first
const QUICK_ACTIONS = [
  { 
    icon: DollarSign, 
    label: "💲 Get wrap pricing", 
    message: "I need wrap pricing for my vehicle",
    primary: true 
  },
  { icon: FileText, label: "Get an exact quote", message: "I want to get an exact quote" },
  { icon: Users, label: "Fleet / bulk pricing", message: "I need fleet or bulk pricing" },
  { icon: Package, label: "How do I order?", message: "How do I place an order?" },
  { icon: Truck, label: "Production & Shipping", message: "Tell me about production time and shipping" },
  { icon: HelpCircle, label: "Order status", message: "I want to check my order or quote status" },
];

const SAMPLE_QUESTIONS = [
  "Get an exact quote",
];

// Session storage key for auto-open tracking
const AUTO_OPEN_KEY = 'wpw-chat-auto-opened';

export function LuigiWebsiteWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `wpw-${crypto.randomUUID()}`);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-open after 12 seconds (once per session)
  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem(AUTO_OPEN_KEY);
    if (alreadyOpened || isOpen) return;

    const timer = setTimeout(() => {
      if (!isOpen && !hasAutoOpened) {
        setIsOpen(true);
        setHasAutoOpened(true);
        sessionStorage.setItem(AUTO_OPEN_KEY, 'true');
      }
    }, 12000);

    return () => clearTimeout(timer);
  }, [isOpen, hasAutoOpened]);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Need wrap pricing? I can give you a fast estimate or send an exact quote.",
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
          session_id: sessionId,
          message_text: text,
          page_url: window.location.href,
          mode: "live",
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
    // Split into words for natural chunking
    const words = fullContent.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      // Add 1-3 words at a time for natural feel
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
      
      // Random delay between 20-60ms per chunk for natural typing feel
      await new Promise((r) => setTimeout(r, 20 + Math.random() * 40));
    }
    
    // Mark typing as complete
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

  // Floating bubble when closed - moved up and left slightly for better visibility
  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-8 z-50 flex flex-col items-end gap-2">
        {/* Teaser text */}
        <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium text-slate-700 animate-in fade-in slide-in-from-right-2 duration-500">
          Need wrap pricing? 💬
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-16 h-16 rounded-full",
            "bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#A855F7]",
            "text-white shadow-2xl flex items-center justify-center",
            "transition-all duration-300 ease-out",
            "hover:scale-110 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]",
            "before:absolute before:inset-0 before:rounded-full",
            "before:bg-gradient-to-br before:from-[#2563EB] before:via-[#7C3AED] before:to-[#A855F7]",
            "before:animate-ping before:opacity-30"
          )}
          style={{
            boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(37, 99, 235, 0.2)"
          }}
        >
          <MessageCircle className="w-7 h-7 relative z-10" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-20 right-8 z-50",
        "w-[400px] max-w-[calc(100vw-48px)]",
        "h-[600px] max-h-[calc(100vh-100px)]",
        "bg-white backdrop-blur-xl",
        "border border-slate-200 rounded-2xl",
        "shadow-2xl flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
      style={{
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 60px rgba(131, 58, 180, 0.1)"
      }}
    >
      {/* Trust Signal Badge */}
      <div className="bg-slate-900 px-4 py-1.5 text-center">
        <span className="text-xs text-slate-300">
          ✨ Live wrap pricing help • Real team • Fast replies
        </span>
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#A855F7] px-4 py-4">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Jordan avatar - "J" initial */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#405DE6] to-[#E1306C] flex items-center justify-center ring-2 ring-white/30 text-xl font-bold text-white">
              J
            </div>
            <div>
              <span className="font-bold text-white block text-lg tracking-tight">
                Jordan
              </span>
              <span className="text-white/90 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                Wrap Pricing Expert • Online
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>


      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
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
                  : "bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-sm"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Sample Question Bubbles - Initial State */}
        {showQuickActions && messages.length === 1 && !isLoading && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {/* Sample Questions */}
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSend(question)}
                  className={cn(
                    "px-3 py-2 text-xs rounded-full",
                    "bg-white border border-slate-200",
                    "hover:bg-slate-50 hover:border-[#833AB4]/30",
                    "text-slate-700 transition-all duration-200"
                  )}
                >
                  "{question}"
                </button>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              {/* Primary CTA */}
              {QUICK_ACTIONS.filter(a => a.primary).map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.message)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-3",
                    "bg-gradient-to-r from-[#833AB4] to-[#E1306C]",
                    "hover:opacity-90 hover:scale-[1.02]",
                    "rounded-xl text-sm font-semibold",
                    "text-white transition-all duration-200",
                    "shadow-lg shadow-[#833AB4]/20"
                  )}
                >
                  <action.icon className="w-5 h-5" />
                  {action.label}
                </button>
              ))}

              {/* Secondary Actions Grid */}
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.filter(a => !a.primary).map((action, i) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.message)}
                    className={cn(
                      "flex items-center gap-2 p-3",
                      "bg-white hover:bg-slate-50",
                      "rounded-xl text-xs font-medium",
                      "border border-slate-200 hover:border-[#833AB4]/30",
                      "transition-all duration-200",
                      "text-slate-700 hover:text-[#833AB4]"
                    )}
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 py-2 animate-in fade-in duration-200">
            <div className="flex gap-1 px-4 py-3 bg-slate-100 rounded-2xl rounded-bl-sm border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#833AB4]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#833AB4]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#833AB4]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-slate-200 bg-white">
        {/* Contextual input hints based on last message */}
        {(() => {
          const lastAssistantMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content.toLowerCase() || '';
          if (lastAssistantMsg.includes('quote number') || lastAssistantMsg.includes('quote #')) {
            return <div className="text-xs text-slate-400 mb-2 px-1">Example: Q-10432</div>;
          }
          if (lastAssistantMsg.includes('order number') || lastAssistantMsg.includes('order #')) {
            return <div className="text-xs text-slate-400 mb-2 px-1">Example: #18392</div>;
          }
          if (lastAssistantMsg.includes('email') && (lastAssistantMsg.includes('send') || lastAssistantMsg.includes('what'))) {
            return <div className="text-xs text-slate-400 mb-2 px-1">We'll only use this to send your quote.</div>;
          }
          if (lastAssistantMsg.includes('name') && lastAssistantMsg.includes('quote')) {
            return <div className="text-xs text-slate-400 mb-2 px-1">This helps us label your quote correctly.</div>;
          }
          if (lastAssistantMsg.includes('company') || lastAssistantMsg.includes('shop name')) {
            return <div className="text-xs text-slate-400 mb-2 px-1">Optional — but helpful for shop or fleet orders.</div>;
          }
          return null;
        })()}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className={cn(
              "flex-1 bg-white border border-slate-300 rounded-full",
              "px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-[#833AB4]/50 focus:border-[#833AB4]/50",
              "transition-all duration-200"
            )}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={cn(
              "shrink-0 rounded-full w-10 h-10",
              "bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#A855F7]",
              "hover:opacity-90 hover:scale-105",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:hover:scale-100"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {/* WePrintWraps.com branding */}
        <div className="mt-2 text-center">
          <span className="text-xs text-slate-400">Powered by </span>
          <span className="text-xs font-medium text-[#7C3AED]">weprintwraps.com</span>
        </div>
      </div>
    </div>
  );
}