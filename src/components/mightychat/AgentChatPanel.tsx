import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send, X, CheckCircle2, Clock, Loader2, Image, Film, FileText, History, Wand2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentChat, type AgentChatMessage } from "@/hooks/useAgentChat";
import { DelegateTaskModal } from "./DelegateTaskModal";
import { AVAILABLE_AGENTS } from "./AgentSelector";
import { AgentChatFileUpload, type Attachment } from "./AgentChatFileUpload";
import { RecentAgentChats } from "./RecentAgentChats";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface AgentChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string | null;
  context?: Record<string, unknown>;
  initialChatId?: string | null;
}

// Content Factory preset structure from CREATE_CONTENT blocks
interface ContentFactoryPreset {
  action: string;
  content_type: string;
  platform: string;
  asset_source: string;
  asset_query?: {
    tags?: string[];
    type?: string;
    limit?: number;
  };
  attached_assets?: Array<{ url: string; type: string; name: string }>;
  hook: string;
  cta: string;
  overlays?: Array<{ text: string; start: number; duration: number }>;
  caption: string;
  hashtags: string;
}

// Parse CREATE_CONTENT block from agent message
function parseCreateContent(message: string): ContentFactoryPreset | null {
  if (!message.includes("===CREATE_CONTENT===")) return null;
  
  try {
    const blockMatch = message.match(/===CREATE_CONTENT===([\s\S]*?)===END_CREATE_CONTENT===/);
    if (!blockMatch) return null;
    
    const content = blockMatch[1];
    
    // Parse key-value pairs from the block
    const getField = (name: string): string => {
      const match = content.match(new RegExp(`${name}:\\s*(.+?)(?:\\n|$)`, 'i'));
      return match ? match[1].trim() : '';
    };
    
    // Parse asset_query block
    const assetQueryMatch = content.match(/asset_query:\s*\n((?:\s+\w+:.*\n?)+)/i);
    let asset_query: ContentFactoryPreset['asset_query'] | undefined;
    if (assetQueryMatch) {
      const queryBlock = assetQueryMatch[1];
      const tagsMatch = queryBlock.match(/tags:\s*\[([^\]]+)\]/i);
      const typeMatch = queryBlock.match(/type:\s*(\w+)/i);
      const limitMatch = queryBlock.match(/limit:\s*(\d+)/i);
      
      asset_query = {
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : undefined,
        type: typeMatch ? typeMatch[1] : undefined,
        limit: limitMatch ? parseInt(limitMatch[1], 10) : undefined,
      };
    }
    
    // Parse overlays block - handle multi-line YAML format
    // AI outputs overlays like:
    // overlays:
    //   - text: 3M Price Drop!
    //     start: 0
    //     duration: 3
    const overlaysMatch = content.match(/overlays:\s*\n([\s\S]*?)(?=\n[a-z_]+:|===|$)/i);
    let overlays: ContentFactoryPreset['overlays'] | undefined;
    if (overlaysMatch) {
      const overlaysBlock = overlaysMatch[1];
      // Split by "- text:" to get individual overlay blocks
      const overlayParts = overlaysBlock.split(/\n\s*-\s*text:\s*/i).filter(Boolean);
      
      if (overlayParts.length > 0) {
        overlays = overlayParts.map(block => {
          // The text value is the first line (before any newline or field)
          const lines = block.split('\n');
          const textValue = lines[0].trim();
          
          // Look for start and duration in the entire block
          const startMatch = block.match(/start:\s*(\d+)/i);
          const durationMatch = block.match(/duration:\s*(\d+)/i);
          
          return {
            text: textValue,
            start: startMatch ? parseInt(startMatch[1], 10) : 0,
            duration: durationMatch ? parseInt(durationMatch[1], 10) : 3,
          };
        }).filter(o => o.text); // Only keep overlays with actual text
      }
    }
    
    // Parse attached_assets block
    const attachedAssetsMatch = content.match(/attached_assets:\s*\n((?:\s+-.*\n?)+)/i);
    let attached_assets: ContentFactoryPreset['attached_assets'] | undefined;
    if (attachedAssetsMatch) {
      const assetBlocks = attachedAssetsMatch[1].split(/\n\s*-/).filter(Boolean);
      attached_assets = assetBlocks.map(block => {
        const urlMatch = block.match(/url:\s*(.+?)(?:\n|$)/i);
        const typeMatch = block.match(/type:\s*(\w+)/i);
        const nameMatch = block.match(/name:\s*(.+?)(?:\n|$)/i);
        return {
          url: urlMatch ? urlMatch[1].trim() : '',
          type: typeMatch ? typeMatch[1].trim() : 'video',
          name: nameMatch ? nameMatch[1].trim() : 'Attached Asset',
        };
      }).filter(a => a.url); // Only keep assets with valid URLs
    }
    
    return {
      action: getField('action') || 'create_content',
      content_type: getField('content_type') || 'reel',
      platform: getField('platform') || 'instagram',
      asset_source: getField('asset_source') || 'contentbox',
      asset_query,
      attached_assets,
      hook: getField('hook'),
      cta: getField('cta'),
      overlays,
      caption: getField('caption'),
      hashtags: getField('hashtags'),
    };
  } catch (e) {
    console.error('[parseCreateContent] Failed to parse:', e);
    return null;
  }
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

  // Check if any agent produced CREATE_CONTENT block - for Content Factory / MightyEdit
  const contentFactoryPreset = useMemo(() => {
    console.log("[AgentChatPanel] Scanning", messages.length, "messages for CREATE_CONTENT");
    
    // Scan all agent messages for CREATE_CONTENT - new Content Factory format
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === "agent") {
        const parsed = parseCreateContent(msg.content);
        if (parsed) {
          console.log("[AgentChatPanel] Found CREATE_CONTENT in message:", msg.id, parsed);
          return parsed;
        }
      }
    }
    console.log("[AgentChatPanel] No CREATE_CONTENT found in messages");
    return null;
  }, [messages]);

  const navigate = useNavigate();

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
                
                {/* Content Factory Panel - shown when agent produces CREATE_CONTENT */}
                {contentFactoryPreset && (
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-sm">Content Factory</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {contentFactoryPreset.content_type} • {contentFactoryPreset.platform}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground text-xs uppercase w-12 shrink-0">Hook</span>
                          <span className="font-medium">{contentFactoryPreset.hook}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground text-xs uppercase w-12 shrink-0">CTA</span>
                          <span>{contentFactoryPreset.cta}</span>
                        </div>
                        {contentFactoryPreset.overlays && contentFactoryPreset.overlays.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground text-xs uppercase w-12 shrink-0">Overlays</span>
                            <span className="text-xs">{contentFactoryPreset.overlays.length} text overlays</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={async () => {
                          // Claim attachments as ContentBox assets before navigating
                          const attachedAssets = contentFactoryPreset.attached_assets || [];
                          let claimedAssetId: string | null = null;
                          
                          if (attachedAssets.length > 0) {
                            try {
                              // Insert into contentbox_assets to claim ownership
                              const { data: asset, error } = await supabase
                                .from('contentbox_assets')
                                .insert({
                                  source: 'agent-chat',
                                  asset_type: attachedAssets[0].type?.startsWith('video') ? 'video' : 'image',
                                  file_url: attachedAssets[0].url,
                                  original_name: attachedAssets[0].name,
                                  scanned: false,
                                  scan_status: 'pending',
                                  tags: ['chat-upload', 'agent-created'],
                                })
                                .select()
                                .single();
                              
                              if (error) {
                                console.error('[AgentChatPanel] Failed to claim asset:', error);
                              } else {
                                claimedAssetId = asset.id;
                                console.log('[AgentChatPanel] Claimed asset:', asset);
                              }
                            } catch (e) {
                              console.error('[AgentChatPanel] Error claiming asset:', e);
                            }
                          }
                          
                          // Store preset with claimed asset ID
                          const presetWithAssets = {
                            ...contentFactoryPreset,
                            attached_assets: attachedAssets,
                            claimed_asset_id: claimedAssetId,
                          };
                          sessionStorage.setItem('mightyedit_preset', JSON.stringify(presetWithAssets));
                          console.log('[AgentChatPanel] Navigating to MightyEdit with preset:', presetWithAssets);
                          navigate('/mighty-edit');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in MightyEdit
                      </Button>
                      
                      {/* Show attached assets info if present */}
                      {contentFactoryPreset.attached_assets && contentFactoryPreset.attached_assets.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Film className="h-3 w-3" />
                          <span>{contentFactoryPreset.attached_assets.length} video(s) attached</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
