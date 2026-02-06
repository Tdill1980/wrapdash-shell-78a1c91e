import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Paperclip, Image, Film, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase, callEdgeFunction } from "@/integrations/supabase/production-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============= TYPES =============
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  isTyping?: boolean;
}

interface Attachment {
  url: string;
  type?: string;
  name?: string;
}

interface ChatWithUploadProps {
  /** Session ID for conversation continuity */
  sessionId?: string;
  /** Organization identifier */
  org?: string;
  /** Agent identifier */
  agent?: string;
  /** Initial welcome message */
  welcomeMessage?: string;
  /** Custom class for the container */
  className?: string;
  /** Callback when a message is sent */
  onMessageSent?: (message: Message) => void;
  /** Callback when a response is received */
  onResponseReceived?: (message: Message) => void;
}

// ============= CONSTANTS =============
const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const ACCEPTED_FILE_TYPES = "image/*,.pdf,.doc,.docx";

// ============= COMPONENT =============
export function ChatWithUpload({
  sessionId: propSessionId,
  org = "wpw",
  agent = "wpw_ai_team",
  welcomeMessage = "Hi! How can I help you today? Feel free to attach any images or documents.",
  className,
  onMessageSent,
  onResponseReceived,
}: ChatWithUploadProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => propSessionId || `chat-${crypto.randomUUID()}`);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============= EFFECTS =============
  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeMessage,
        },
      ]);
    }
  }, [isOpen, messages.length, welcomeMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============= FILE UPLOAD HANDLERS =============
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setUploading(true);
    const newAttachments: Attachment[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_SIZE_MB}MB limit`);
          continue;
        }

        // Upload to media-library bucket
        const ext = file.name.split('.').pop();
        const fileName = `chat-uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

        const { data, error } = await supabase.storage
          .from("media-library")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from("media-library")
          .getPublicUrl(data.path);

        newAttachments.push({
          url: publicUrl.publicUrl,
          type: file.type,
          name: file.name,
        });
      }

      if (newAttachments.length > 0) {
        setAttachments(prev => [...prev, ...newAttachments]);
        toast.success(`${newAttachments.length} file(s) attached`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type?: string) => {
    if (type?.startsWith("image/")) return Image;
    if (type?.startsWith("video/")) return Film;
    return FileText;
  };

  // ============= MESSAGE HANDLERS =============
  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if ((!text && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    onMessageSent?.(userMessage);

    try {
      const data = await callEdgeFunction('command-chat', {
        org,
        agent,
        mode: "live",
        session_id: sessionId,
        message_text: text,
        attachments: userMessage.attachments,
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      });

      if (data?.reply || data?.message) {
        const fullContent = data.reply || data.message;
        const messageId = crypto.randomUUID();

        // Add empty message that will be typed out
        setMessages(prev => [
          ...prev,
          {
            id: messageId,
            role: "assistant",
            content: "",
            isTyping: true,
          },
        ]);
        setIsLoading(false);

        // Type out the message
        await typeMessage(messageId, fullContent);
        
        const responseMessage: Message = {
          id: messageId,
          role: "assistant",
          content: fullContent,
        };
        onResponseReceived?.(responseMessage);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
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

  // Type message with natural chunking
  const typeMessage = async (messageId: string, fullContent: string) => {
    const words = fullContent.split(' ');
    let currentContent = '';

    for (let i = 0; i < words.length; i++) {
      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const chunk = words.slice(i, i + chunkSize).join(' ');
      currentContent += (currentContent ? ' ' : '') + chunk;
      i += chunkSize - 1;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: currentContent }
            : msg
        )
      );

      await new Promise(r => setTimeout(r, 20 + Math.random() * 40));
    }

    setMessages(prev =>
      prev.map(msg =>
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

  // ============= RENDER: CLOSED STATE =============
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full",
          "bg-gradient-to-r from-primary via-purple-600 to-pink-600",
          "text-primary-foreground shadow-2xl flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]",
          "before:absolute before:inset-0 before:rounded-full",
          "before:bg-gradient-to-r before:from-primary before:via-purple-600 before:to-pink-600",
          "before:animate-ping before:opacity-30",
          className
        )}
      >
        <MessageCircle className="w-7 h-7 relative z-10" />
      </button>
    );
  }

  // ============= RENDER: OPEN STATE =============
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-[400px] max-w-[calc(100vw-48px)]",
        "h-[600px] max-h-[calc(100vh-100px)]",
        "bg-background backdrop-blur-xl",
        "border border-border rounded-2xl",
        "shadow-2xl flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-5 duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary via-purple-600 to-pink-600 px-4 py-4">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30 text-lg font-bold text-white shadow-lg backdrop-blur-sm">
              💬
            </div>
            <div>
              <span className="font-bold text-white block text-lg tracking-tight">Chat Support</span>
              <span className="text-white/90 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                Online • Ready to help
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
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
                  ? "bg-primary text-primary-foreground ml-auto rounded-br-sm"
                  : "bg-card text-card-foreground border border-border rounded-bl-sm shadow-sm"
              )}
            >
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.attachments.map((att, idx) => {
                    const isImage = att.type?.startsWith("image/");
                    return isImage ? (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-border/50 hover:opacity-90 transition"
                      >
                        <img
                          src={att.url}
                          alt={att.name || "Attachment"}
                          className="h-24 w-24 object-cover"
                        />
                      </a>
                    ) : (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs hover:bg-muted/80 transition"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="truncate max-w-[120px]">{att.name || "File"}</span>
                      </a>
                    );
                  })}
                </div>
              )}
              {message.content}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 py-2 animate-in fade-in duration-200">
            <div className="flex gap-1 px-4 py-3 bg-card rounded-2xl rounded-bl-sm border border-border">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-muted/50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => {
              const Icon = getFileIcon(att.type);
              const isImage = att.type?.startsWith("image/");

              return (
                <div
                  key={idx}
                  className="relative group rounded-lg border border-border overflow-hidden bg-card"
                >
                  {isImage ? (
                    <img
                      src={att.url}
                      alt={att.name || "Attachment"}
                      className="h-14 w-14 object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 flex flex-col items-center justify-center p-2">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center mt-1">
                        {att.name?.slice(0, 8) || "File"}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading || uploading || attachments.length >= MAX_FILES}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "h-10 w-10 shrink-0",
              attachments.length > 0 && "text-primary"
            )}
            title={`Attach files (max ${MAX_FILES})`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className={cn(
              "flex-1 bg-muted border border-border rounded-full",
              "px-4 py-2.5 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              "transition-all duration-200",
              "placeholder:text-muted-foreground"
            )}
          />

          {/* Send Button */}
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className={cn(
              "shrink-0 rounded-full w-10 h-10",
              "bg-gradient-to-r from-primary to-purple-600",
              "hover:opacity-90 hover:scale-105",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:hover:scale-100"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Helper Text */}
        <div className="mt-2 text-center text-xs text-muted-foreground">
          {attachments.length > 0 
            ? `${attachments.length}/${MAX_FILES} files attached` 
            : "Images, PDFs, and documents supported"
          }
        </div>
      </div>
    </div>
  );
}

export default ChatWithUpload;
