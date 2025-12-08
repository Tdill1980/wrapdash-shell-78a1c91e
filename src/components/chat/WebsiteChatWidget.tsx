import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function WebsiteChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `website-${crypto.randomUUID()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hey! 👋 Ready for a wrap quote? Tell me your vehicle year, make, and model to get started.",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ingest-message", {
        body: {
          platform: "website",
          sender_id: sessionId,
          sender_username: "Website Visitor",
          message_text: userMessage.content,
          metadata: {
            page_url: window.location.href,
          },
        },
      });

      if (error) throw error;

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
          },
        ]);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendQuick = (text: string) => {
    setInput(text);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
          <span className="font-semibold text-primary-foreground">WrapCommand AI</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, idx) => (
          <div key={message.id}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.content}
            </div>

            {/* CTA Buttons after assistant messages */}
            {message.role === "assistant" && idx === messages.length - 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-xs font-medium text-primary transition-colors"
                  onClick={() => handleSendQuick("I want a wrap quote")}
                >
                  Get a Quote
                </button>
                <button
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-xs font-medium text-primary transition-colors"
                  onClick={() => handleSendQuick("Show me wrap colors")}
                >
                  Wrap Colors
                </button>
                <button
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-xs font-medium text-primary transition-colors"
                  onClick={() => handleSendQuick("Show me examples")}
                >
                  See Examples
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 bg-muted border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
