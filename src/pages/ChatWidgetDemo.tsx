import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ChatWidgetDemo() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: "agent", text: "Hey! 👋 I'm your WePrintWraps AI assistant. Ask me anything about vehicle wraps, get a quote, or tell me about your project!" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = `<script defer src="https://wrapcommandai.com/embed/chat-widget.js"
  data-org="wpw"
  data-agent="wpw_ai_team"
  data-mode="live"></script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Embed code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendDemo = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Simulate AI delay, then show example response
    setTimeout(() => {
      setIsTyping(false);
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          text: userMsg.toLowerCase().includes("quote")
            ? "Alright! For a 2020 Ford Transit full wrap, the price is $8,399. I just sent the full breakdown to your email! 💪"
            : "Great question! We specialize in premium wrap films from Avery and 3M. What vehicle are you looking to wrap?"
        }
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/website-agent">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Chat Widget Preview</h1>
              <p className="text-sm text-muted-foreground">This is exactly what customers see on your site</p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">LIVE PREVIEW</Badge>
        </div>
      </div>

      {/* Fake website background */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="p-6 bg-card/30 border-dashed mb-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">👆 Your website content appears here</p>
            <p className="text-sm">The chat widget floats in the bottom-right corner on every page</p>
          </div>
        </Card>

        {/* Embed code card */}
        <Card className="p-6 mb-8">
          <h2 className="font-semibold mb-3">Copy this code into your WordPress footer.php (before &lt;/body&gt;)</h2>
          <div className="relative">
            <pre className="bg-muted/50 p-4 rounded-lg text-sm border border-border overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={copyCode}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>

      {/* ============ LIVE CHAT WIDGET PREVIEW ============ */}
      <div className="fixed bottom-5 right-5 z-[9999] font-sans">
        {/* Chat Window */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-[380px] h-[500px] bg-[#1a1a2e] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                🤖
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-base">WPW AI TEAM</h3>
                <p className="text-white/80 text-xs">Vehicle Wrap Experts • Online</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white text-2xl leading-none hover:opacity-80"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "self-end bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white rounded-br-sm"
                      : "self-start bg-white/10 text-gray-200 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div className="self-start bg-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendDemo()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-full bg-white/5 border border-white/20 text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-[#833AB4]"
              />
              <button
                onClick={sendDemo}
                className="w-11 h-11 rounded-full bg-gradient-to-r from-[#405DE6] to-[#E1306C] text-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Bubble */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#E1306C] cursor-pointer flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
