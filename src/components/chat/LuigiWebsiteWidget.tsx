import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, X, Send, Sparkles, FileCheck, DollarSign, 
  Palette, Wrench, Package, HelpCircle, Settings, Info, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { 
    icon: FileCheck, 
    label: "WrapGuruAI® Check My File", 
    message: "I want WrapGuruAI to check my design file",
    primary: true 
  },
  { icon: DollarSign, label: "Price Non-Vehicle", message: "I need pricing for a non-vehicle project" },
  { icon: Palette, label: "Design Help", message: "I need design help for my wrap project" },
  { icon: Wrench, label: "Install Help", message: "I have questions about installation" },
  { icon: Package, label: "Specialty Request", message: "I have a specialty film request" },
  { icon: HelpCircle, label: "Order Questions", message: "I have questions about my order" },
];

const SAMPLE_QUESTIONS = [
  "How much does a wrap cost?",
  "How do I set a cut contour file?",
];

export function LuigiWebsiteWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `website-${crypto.randomUUID()}`);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showKnowledgeInfo, setShowKnowledgeInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "👋 Hey! I'm Luigi — The AI Wrap Squeegee. I'm powered by WrapGuruAI® and trained on everything wrap-related. Ask me anything about pricing, design files, materials, or installation!",
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
      const { data, error } = await supabase.functions.invoke("website-chat", {
        body: {
          org: "wpw",
          agent: "jordan_lee",
          mode: "live",
          session_id: sessionId,
          message_text: text,
          page_url: window.location.href,
        },
      });

      if (error) throw error;

      if (data?.reply || data?.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply || data.message,
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
          "bg-gradient-to-br from-primary via-primary to-[hsl(var(--gradient-dark))]",
          "text-primary-foreground shadow-2xl flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]",
          "before:absolute before:inset-0 before:rounded-full",
          "before:bg-gradient-to-br before:from-primary before:to-[hsl(var(--gradient-dark))]",
          "before:animate-ping before:opacity-30"
        )}
        style={{
          boxShadow: "0 4px 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)"
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
        "w-[400px] max-w-[calc(100vw-48px)]",
        "h-[600px] max-h-[calc(100vh-100px)]",
        "bg-card/95 backdrop-blur-xl",
        "border border-border rounded-2xl",
        "shadow-2xl flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
      style={{
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px hsl(var(--primary) / 0.15)"
      }}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary via-primary to-[hsl(var(--gradient-dark))] px-4 py-4">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Squeegee mascot avatar */}
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30 text-2xl">
              🧽
            </div>
            <div>
              <span className="font-bold text-primary-foreground block text-lg tracking-tight">
                Luigi — The AI Wrap Squeegee
              </span>
              <span className="text-primary-foreground/90 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                Online
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKnowledgeInfo(!showKnowledgeInfo)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
              title="About Luigi's Knowledge"
            >
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
            >
              <X className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* WrapGuruAI Badge */}
        <div className="relative flex items-center gap-2 mt-3">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/20 text-primary-foreground backdrop-blur flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Beta of WrapGuruAI®
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-200 backdrop-blur flex items-center gap-1">
            <Info className="w-3 h-3" />
            Knowledge Base Active
          </span>
        </div>
      </div>

      {/* Knowledge Info Panel (collapsible) */}
      {showKnowledgeInfo && (
        <div className="px-4 py-3 bg-secondary/80 border-b border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            About Luigi's Knowledge
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• WrapPhile Pro print/cut specifications</li>
            <li>• Vehicle wrap material pricing & options</li>
            <li>• Design file requirements (Adobe, Flexi, etc.)</li>
            <li>• Installation best practices</li>
            <li>• Specialty film knowledge (PPF, tint, chrome)</li>
          </ul>
        </div>
      )}

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
                  ? "bg-gradient-to-r from-primary to-[hsl(var(--gradient-dark))] text-primary-foreground ml-auto rounded-br-sm shadow-lg"
                  : "bg-secondary border border-border text-foreground rounded-bl-sm"
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
                    "bg-secondary border border-border",
                    "hover:bg-primary/10 hover:border-primary/30",
                    "text-foreground transition-all duration-200"
                  )}
                >
                  "{question}"
                </button>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              {/* Primary CTA - File Check */}
              {QUICK_ACTIONS.filter(a => a.primary).map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.message)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-3",
                    "bg-gradient-to-r from-primary to-[hsl(var(--gradient-dark))]",
                    "hover:opacity-90 hover:scale-[1.02]",
                    "rounded-xl text-sm font-semibold",
                    "text-primary-foreground transition-all duration-200",
                    "shadow-lg shadow-primary/20"
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
                      "bg-secondary hover:bg-primary/10",
                      "rounded-xl text-xs font-medium",
                      "border border-border hover:border-primary/30",
                      "transition-all duration-200",
                      "text-foreground/80 hover:text-primary"
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
            <div className="flex gap-1 px-4 py-3 bg-secondary rounded-2xl rounded-bl-sm border border-border">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border bg-card/80">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className={cn(
              "flex-1 bg-secondary border border-border rounded-full",
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
              "bg-gradient-to-r from-primary to-[hsl(var(--gradient-dark))]",
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
