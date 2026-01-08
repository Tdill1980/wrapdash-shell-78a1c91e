import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { label: "Get a Quote", message: "I want a quote for my vehicle" },
  { label: "Bulk/Fleet Pricing", message: "I need bulk pricing for multiple vehicles" },
  { label: "Join ClubWPW", message: "Tell me about ClubWPW rewards" },
  { label: "Track My Order", message: "I want to track my order" },
];

export function WebsiteChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `wpw-${crypto.randomUUID()}`);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hey! 👋 I'm WPW AI TEAM. Want a wrap quote? Tell me your vehicle year, make, and model to get started!",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isLoading) return;

    setInput("");
    setShowQuick(false);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("website-chat", {
        body: {
          org: "wpw",
          agent: "wpw_ai_team",
          session_id: sessionId,
          message_text: content,
          page_url: window.location.href,
          // organization_id can be passed here for multi-tenant support
          // Defaults to WPW org (51aa96db-c06d-41ae-b3cb-25b045c75caf) on backend
          organization_id: undefined,
        },
      });

      if (error) throw error;

      if (data?.reply) {
        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Oops! Something went wrong. Try again in a moment. 😅",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Closed bubble
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full 
        shadow-[0_8px_30px_rgba(236,72,153,0.4)]
        bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600
        flex items-center justify-center text-white 
        hover:scale-110 hover:shadow-[0_12px_40px_rgba(236,72,153,0.5)] transition-all"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  // Open chat window
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]
      bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
      flex flex-col overflow-hidden animate-fade-in"
    >
      {/* HEADER - Vibrant Pink Gradient */}
      <div className="px-5 py-4 bg-gradient-to-r from-pink-500 via-pink-600 to-rose-500 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
          J
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            Jordan
          </div>
          <div className="flex items-center gap-1.5 text-white/80 text-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            WPW Live Chat Agent • Online
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="p-4 space-y-3 h-80 overflow-y-auto bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white rounded-2xl rounded-tl-md self-start shadow-[0_4px_15px_rgba(59,130,246,0.3)]"
                : "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-md self-end ml-auto shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {/* Quick Actions */}
        {showQuick && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                onClick={() => sendMessage(qa.message)}
                className="px-3 py-2.5 text-xs rounded-xl border-2 border-pink-200
                bg-white text-pink-600 font-medium hover:bg-pink-50 hover:border-pink-300 transition-all shadow-sm"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
            Jordan is typing…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-3 flex gap-2 items-center border-t border-gray-100 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-full bg-gray-100 text-gray-900 
          placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all"
        />

        <button
          disabled={isLoading || !input.trim()}
          onClick={() => sendMessage()}
          className="w-11 h-11 rounded-full flex items-center justify-center
          bg-gradient-to-br from-pink-500 to-rose-500 text-white 
          hover:shadow-[0_4px_20px_rgba(236,72,153,0.4)] transition-all disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Footer */}
      <div className="py-2 text-center text-xs text-gray-400 bg-white border-t border-gray-50">
        Powered by <span className="text-pink-500 font-medium">weprintwraps.com</span>
      </div>
    </div>
  );
}
