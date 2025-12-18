import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send, X, CheckCircle2, Clock, Loader2, Image, Film, FileText, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentChat, type AgentChatMessage } from "@/hooks/useAgentChat";
import { DelegateTaskModal } from "./DelegateTaskModal";
import { AVAILABLE_AGENTS } from "./AgentSelector";
import { AgentChatFileUpload, type Attachment } from "./AgentChatFileUpload";
import { ReelRenderPanel, parseVideoContent } from "./ReelRenderPanel";
import { RecentAgentChats } from "./RecentAgentChats";

interface AgentChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string | null;
  context?: Record<string, unknown>;
  initialChatId?: string | null;
}

export function AgentChatPanel({ open, onOpenChange, agentId, context, initialChatId }: AgentChatPanelProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    chatId,
    agent,
    messages,
    loading,
    sending,
    confirmed,
    suggestedTask,
    recentChats,
    loadingRecent,
    startChat,
    sendMessage,
    delegateTask,
    closeChat,
    loadRecentChats,
    resumeChat,
  } = useAgentChat();

  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      setShowRecentChats(false);
      setInitialLoadDone(false);
    }
  }, [open]);

  // Handle initialChatId - resume specific chat when provided
  useEffect(() => {
    if (open && initialChatId && !initialLoadDone) {
      setInitialLoadDone(true);
      resumeChat(initialChatId);
    }
  }, [open, initialChatId, initialLoadDone, resumeChat]);

  // Load recent chats when panel opens (only if no initialChatId)
  useEffect(() => {
    if (open && agentId && !initialLoadDone && !initialChatId) {
      setInitialLoadDone(true);
      loadRecentChats(agentId);
    }
  }, [open, agentId, initialLoadDone, initialChatId, loadRecentChats]);

  // After initial load, decide whether to show recent chats or start new chat
  useEffect(() => {
    if (open && agentId && initialLoadDone && !loadingRecent && !chatId && !initialChatId) {
      if (recentChats.length > 0) {
        setShowRecentChats(true);
      } else {
        startChat(agentId, context);
      }
    }
  }, [open, agentId, initialLoadDone, loadingRecent, chatId, recentChats.length, startChat, context, initialChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleEndChat = useCallback(() => {
    closeChat();
    setAttachments([]);
    setShowRecentChats(false);
    setInitialLoadDone(false);
    onOpenChange(false);
  }, [closeChat, onOpenChange]);

  const handleSend = useCallback(() => {
    if ((input.trim() || attachments.length > 0) && !sending) {
      // Debug logging for attachment tracking
      console.log("[AgentChat] Sending message with attachments:", {
        attachmentCount: attachments.length,
        attachments: attachments.map(a => ({ name: a.name, type: a.type, urlPreview: a.url?.slice(0, 50) })),
      });
      
      const msg = input.trim() || (attachments.length > 0 ? `[Attached ${attachments.length} file(s)]` : "");
      sendMessage(msg, attachments.length > 0 ? attachments : undefined);
      setInput("");
      setAttachments([]);
    }
  }, [input, attachments, sending, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleDelegate = useCallback(async (description: string) => {
    const result = await delegateTask(description);
    if (result.success) {
      setShowDelegateModal(false);
    }
  }, [delegateTask]);

  const handleResumeChat = useCallback(async (existingChatId: string) => {
    setShowRecentChats(false);
    await resumeChat(existingChatId);
  }, [resumeChat]);

  const handleNewChat = useCallback(() => {
    setShowRecentChats(false);
    if (agentId) {
      startChat(agentId, context);
    }
  }, [agentId, startChat, context]);

  const handleShowHistory = useCallback(() => {
    closeChat();
    setShowRecentChats(true);
    if (agentId) {
      loadRecentChats(agentId);
    }
  }, [closeChat, agentId, loadRecentChats]);

  const handleLoadChats = useCallback((filterAgentId?: string) => {
    loadRecentChats(filterAgentId);
  }, [loadRecentChats]);

  const agentConfig = AVAILABLE_AGENTS.find((a) => a.id === agentId);

  // Check if Noah Bennett produced video content in the conversation
  const videoContent = useMemo(() => {
    console.log("[AgentChatPanel] Checking for video content, agentId:", agentId, "agent?.id:", agent?.id);
    
    // Check both agentId prop and actual agent from chat
    const isNoah = agentId === "noah_bennett" || agent?.id === "noah_bennett";
    if (!isNoah) {
      console.log("[AgentChatPanel] Not Noah Bennett, skipping video content check");
      return null;
    }
    
    console.log("[AgentChatPanel] Noah Bennett detected, scanning", messages.length, "messages for VIDEO_CONTENT");
    
    // Look for VIDEO_CONTENT block in agent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === "agent") {
        const parsed = parseVideoContent(msg.content);
        if (parsed) {
          console.log("[AgentChatPanel] Found VIDEO_CONTENT in message:", msg.id, parsed);
          return parsed;
        }
      }
    }
    console.log("[AgentChatPanel] No VIDEO_CONTENT found in messages");
    return null;
  }, [messages, agentId, agent]);

  // Find the most recent video attachment or URL from user messages
  const uploadedVideoUrl = useMemo(() => {
    // First check current attachments
    const videoAtt = attachments.find(att => att.type?.startsWith("video/"));
    if (videoAtt) return videoAtt.url;
    
    // Then check message history for video attachments
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === "user" && msg.metadata?.attachments) {
        const atts = msg.metadata.attachments as Attachment[];
        const videoAttachment = atts.find(att => att.type?.startsWith("video/"));
        if (videoAttachment) return videoAttachment.url;
      }
    }
    
    // Finally, scan message text for video URLs (pasted links)
    const videoUrlRegex = /(https?:\/\/[^\s]+\.(mp4|mov|webm|avi|mkv|m4v|MP4|MOV|WEBM|AVI|MKV|M4V)(\?[^\s]*)?)/gi;
    const storageUrlRegex = /(https?:\/\/[^\s]*(?:storage|media|video|supabase)[^\s]*)/gi;
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const content = messages[i].content;
      // Check for explicit video file extensions
      const videoMatch = content.match(videoUrlRegex);
      if (videoMatch) return videoMatch[0];
      
      // Check for storage URLs that might be videos
      const storageMatch = content.match(storageUrlRegex);
      if (storageMatch) {
        const url = storageMatch[0];
        // Only return if it looks like a media file
        if (url.match(/\.(mp4|mov|webm|avi|mkv|m4v)/i)) {
          return url;
        }
      }
    }
    
    return null;
  }, [messages, attachments]);

  const getStatusBadge = () => {
    if (confirmed) {
      return (
        <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ready to Delegate
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-400 border-amber-500/30">
        <Clock className="w-3 h-3 mr-1" />
        Clarifying
      </Badge>
    );
  };

  // Show recent chats view
  if (showRecentChats && !chatId) {
    return (
      <Sheet open={open} onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setShowRecentChats(false);
          setInitialLoadDone(false);
          onOpenChange(false);
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5" />
                Chat History
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <RecentAgentChats
            recentChats={recentChats}
            loading={loadingRecent}
            agentId={agentId || undefined}
            onResumeChat={handleResumeChat}
            onNewChat={handleNewChat}
            onLoadChats={handleLoadChats}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setInitialLoadDone(false);
          onOpenChange(false);
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <span>🧠</span>
                Agent Chat
              </SheetTitle>
              <div className="flex items-center gap-1">
                {recentChats.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleShowHistory}
                    title="View chat history"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {agent && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {agentConfig && (
                    <div className={cn("p-1.5 rounded", agentConfig.color)}>
                      <agentConfig.icon className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.role}</div>
                  </div>
                </div>
                {getStatusBadge()}
              </div>
            )}
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>Start a conversation with {agent?.name || "the agent"}.</p>
                <p className="mt-1 text-xs">Ask questions, clarify intent, then delegate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} agentName={agent?.name} />
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                
                {/* Video Render Panel - shown when Noah Bennett produces video content */}
                {videoContent && (agentId === "noah_bennett" || agent?.id === "noah_bennett") && (
                  <div className="pt-4">
                    <ReelRenderPanel 
                      videoContent={videoContent}
                      organizationId={context?.organization_id as string}
                      initialVideoUrl={uploadedVideoUrl || undefined}
                    />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border/50 space-y-3">
            {/* Attachment previews - Enhanced visibility */}
            {attachments.length > 0 && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {attachments.length} file{attachments.length > 1 ? 's' : ''} ready to send
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, idx) => {
                    const isImage = att.type?.startsWith("image/");
                    const isVideo = att.type?.startsWith("video/");
                    const Icon = isImage ? Image : isVideo ? Film : FileText;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "relative group rounded-lg border overflow-hidden bg-background",
                          isVideo ? "border-primary ring-2 ring-primary/30" : "border-border/50"
                        )}
                      >
                        {isImage ? (
                          <img
                            src={att.url}
                            alt={att.name || "Attachment"}
                            className="h-14 w-14 object-cover"
                          />
                        ) : isVideo ? (
                          <div className="h-14 w-20 flex flex-col items-center justify-center p-1 bg-primary/5">
                            <Film className="w-5 h-5 text-primary" />
                            <span className="text-[9px] text-primary font-medium truncate w-full text-center mt-0.5">
                              {att.name?.slice(0, 12) || "Video"}
                            </span>
                          </div>
                        ) : (
                          <div className="h-14 w-14 flex flex-col items-center justify-center p-1">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center mt-0.5">
                              {att.name?.slice(0, 8) || "File"}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
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

            <div className="flex gap-2 items-end">
              <AgentChatFileUpload
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                disabled={sending || loading}
              />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask, clarify, or attach files..."
                disabled={sending || loading}
                className="flex-1"
              />
              <Button 
                onClick={handleSend} 
                disabled={(!input.trim() && attachments.length === 0) || sending || loading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEndChat}
              >
                End chat
              </Button>
              <Button
                className="flex-1"
                disabled={!confirmed}
                onClick={() => setShowDelegateModal(true)}
              >
                {confirmed ? "Delegate Task" : "Waiting for Confirmation..."}
              </Button>
            </div>

            {!confirmed && (
              <p className="text-xs text-muted-foreground text-center">
                Agent must confirm understanding before delegation
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DelegateTaskModal
        open={showDelegateModal}
        onOpenChange={setShowDelegateModal}
        agentName={agent?.name || "Agent"}
        suggestedTask={suggestedTask}
        linkedThread={{
          subject: (context?.subject as string | undefined) || (context?.customerName as string | undefined),
          inboxLabel: context?.channel === "email"
            ? (context?.recipientInbox as string | undefined) || (context?.recipient_inbox as string | undefined)
            : (context?.channel as string | undefined),
          conversationId: (context?.conversationId as string | undefined) || (context?.conversation_id as string | undefined),
        }}
        onOpenThread={(conversationId) => {
          window.location.href = `/mightychat?id=${conversationId}`;
        }}
        onDelegate={handleDelegate}
      />
    </>
  );
}

function MessageBubble({ message, agentName }: { message: AgentChatMessage; agentName?: string }) {
  const isUser = message.sender === "user";
  const imageUrl = message.metadata?.image_url as string | undefined;
  const userAttachments = message.metadata?.attachments;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%] text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {!isUser && (
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {agentName || "Agent"}
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        {/* Display user attachments */}
        {isUser && userAttachments && userAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {userAttachments.map((att, idx) => {
              const isImage = att.type?.startsWith("image/");
              const isVideo = att.type?.startsWith("video/");
              const Icon = isImage ? Image : isVideo ? Film : FileText;

              return isImage ? (
                <img
                  key={idx}
                  src={att.url}
                  alt={att.name || "Attachment"}
                  className="rounded-md max-h-32 object-cover border border-primary-foreground/20"
                />
              ) : (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-primary-foreground/10 rounded px-2 py-1 text-xs"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[100px]">{att.name || "File"}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Display generated image */}
        {imageUrl && (
          <div className="mt-3">
            <img 
              src={imageUrl} 
              alt="Generated image"
              className="rounded-lg max-w-full h-auto border border-border/50"
              style={{ maxHeight: "300px" }}
            />
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              🎨 AI Generated
            </div>
          </div>
        )}
        
        {message.metadata?.confirmed && (
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">
            <CheckCircle2 className="w-3 h-3" />
            Ready to delegate
          </div>
        )}
      </div>
    </div>
  );
}
