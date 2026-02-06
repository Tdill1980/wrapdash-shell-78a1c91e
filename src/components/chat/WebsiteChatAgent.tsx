import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Loader2, CheckCircle } from "lucide-react";
import { supabase, callEdgeFunction } from "@/integrations/supabase/production-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quoteSent?: {
    email: string;
    quoteNumber: string;
    amount: number;
    sentAt: string;
  };
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

  // Welcome message - simple, human
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hey! 👋 What kind of wrap project are you working on?",
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
      const data = await callEdgeFunction('command-chat', {
        org: "wpw",
        agent: "wpw_ai_team",
        session_id: sessionId,
        message_text: content,
        page_url: window.location.href,
        organization_id: undefined,
      });

      if (data?.reply) {
        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          // Backend-confirmed quote sent data
          quoteSent: data.quote_sent ? {
            email: data.quote_email || '',
            quoteNumber: data.quote_number || '',
            amount: data.quote_amount || 0,
            sentAt: data.quote_sent_at || new Date().toISOString(),
          } : undefined,
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

  // Closed bubble - Purple/Magenta gradient
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full 
        shadow-[0_8px_30px_rgba(168,85,247,0.5)]
        bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500
        flex items-center justify-center text-white 
        hover:scale-110 hover:shadow-[0_12px_40px_rgba(168,85,247,0.6)] transition-all"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  // Open chat window
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]
      bg-[#1a1a2e] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] 
      flex flex-col overflow-hidden animate-fade-in border border-white/10"
    >
      {/* HEADER - Purple/Blue/Magenta Gradient */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 flex items-center gap-3">
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

      {/* MESSAGES - Dark background */}
      <div className="p-4 space-y-3 h-80 overflow-y-auto bg-[#16162a]">
        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500 text-white rounded-2xl rounded-tl-md self-start shadow-[0_4px_15px_rgba(168,85,247,0.4)]"
                  : "bg-[#2a2a4a] text-white rounded-2xl rounded-tr-md self-end ml-auto border border-white/10"
              }`}
            >
              {msg.content}
            </div>
            {/* Backend-confirmed Quote Sent Card */}
            {msg.quoteSent && (
              <div className="mx-1 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-green-300 font-medium">Quote sent to {msg.quoteSent.email}</span>
                  {msg.quoteSent.quoteNumber && (
                    <span className="text-green-400/70 text-xs ml-2">#{msg.quoteSent.quoteNumber}</span>
                  )}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Quick Actions */}
        {showQuick && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                onClick={() => sendMessage(qa.message)}
                className="px-3 py-2.5 text-xs rounded-xl border border-purple-500/30
                bg-[#2a2a4a] text-white font-medium hover:bg-purple-500/20 hover:border-purple-400 transition-all"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-purple-300 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" />
            Jordan is typing…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR - Dark */}
      <div className="p-3 flex gap-2 items-center border-t border-white/10 bg-[#1a1a2e]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-full bg-[#2a2a4a] text-white 
          placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-purple-500 transition-all border border-white/10"
        />

        <button
          disabled={isLoading || !input.trim()}
          onClick={() => sendMessage()}
          className="w-11 h-11 rounded-full flex items-center justify-center
          bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 text-white 
          hover:shadow-[0_4px_20px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Footer - Dark */}
      <div className="py-2 text-center text-xs text-gray-500 bg-[#1a1a2e] border-t border-white/5">
        Powered by <span className="text-fuchsia-400 font-medium">weprintwraps.com</span>
      </div>
    </div>
  );
}
