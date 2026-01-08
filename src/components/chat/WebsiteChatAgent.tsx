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
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-xl 
        bg-gradient-to-br from-primary via-primary/80 to-accent
        flex items-center justify-center text-white 
        hover:scale-110 transition-all animate-pulse"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  // Open chat window
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[360px] max-w-full
      bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl 
      flex flex-col overflow-hidden animate-fade-in"
    >
      {/* HEADER */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-foreground font-bold">
            WPW AI TEAM
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">Online now</p>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground transition"
        >
          <X />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="p-4 space-y-3 h-80 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-primary to-accent text-primary-foreground self-start"
                : "bg-muted text-foreground self-end ml-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {/* Quick Actions */}
        {showQuick && (
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                onClick={() => sendMessage(qa.message)}
                className="px-3 py-2 text-xs rounded-xl border border-primary/30
                bg-primary/10 text-primary hover:bg-primary/20 transition flex items-center gap-2"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            WPW AI TEAM is typing…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-3 flex gap-2 items-center border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Type your message…"
          className="flex-1 px-4 py-2 rounded-full bg-muted text-foreground 
          placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          disabled={isLoading || !input.trim()}
          onClick={() => sendMessage()}
          className="w-10 h-10 rounded-full flex items-center justify-center
          bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
