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
import { Send, X, CheckCircle2, Clock, Loader2, Image, Film, FileText, History, Wand2, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentChat, type AgentChatMessage } from "@/hooks/useAgentChat";
import { DelegateTaskModal } from "./DelegateTaskModal";
import { AVAILABLE_AGENTS } from "./AgentSelector";
import { AgentChatFileUpload, type Attachment } from "./AgentChatFileUpload";
import { RecentAgentChats } from "./RecentAgentChats";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProducerJob, ProducerJobClip, ProducerJobOverlay } from "@/types/ProducerJob";
import { 
  parseCreateContent, 
  stripInternalBlocksForDisplay, 
  validateCreateContent,
  type ParsedCreateContent 
} from "@/lib/createContentBlocks";

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
  overlays?: Array<{ text: string; start: number; duration: number; position?: string; style?: string }>;
  caption: string;
  hashtags: string[];
}

// Convert ParsedCreateContent to ContentFactoryPreset format
function toContentFactoryPreset(parsed: ParsedCreateContent): ContentFactoryPreset {
  return {
    action: parsed.action || 'create_content',
    content_type: parsed.content_type || 'reel',
    platform: parsed.platform || 'instagram',
    asset_source: parsed.asset_source || 'contentbox',
    asset_query: parsed.asset_query,
    attached_assets: parsed.attached_assets,
    hook: parsed.hook || '',
    cta: parsed.cta || '',
    overlays: parsed.overlays,
    caption: parsed.caption || '',
    hashtags: parsed.hashtags || [],
  };
}

// Create a content_calendar draft entry
async function createCalendarDraftFromPreset(args: {
  brand?: string;
  platform?: string;
  content_type?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
}): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const scheduled_date = `${yyyy}-${mm}-${dd}`;

  const { data, error } = await supabase
    .from("content_calendar")
    .insert({
      brand: args.brand ?? "wpw",
      platform: args.platform ?? "instagram",
      content_type: args.content_type ?? "reel",
      scheduled_date,
      scheduled_time: "12:00",
      title: args.hook ?? null,
      caption: args.caption ?? null,
      hashtags: args.hashtags ?? [],
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
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
    return result;
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
  const { contentFactoryPreset, rawCreateContentBlock } = useMemo((): { contentFactoryPreset: ContentFactoryPreset | null; rawCreateContentBlock: string | null } => {
    console.log("[AgentChatPanel] Scanning", messages.length, "messages for CREATE_CONTENT");
    
    // Scan all agent messages for CREATE_CONTENT - new Content Factory format
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === "agent") {
        const parsed = parseCreateContent(msg.content);
        if (parsed) {
          console.log("[AgentChatPanel] Found CREATE_CONTENT in message:", msg.id, parsed);
          // Extract raw block for execute-create-content
          const startIdx = msg.content.indexOf("===CREATE_CONTENT===");
          const endIdx = msg.content.indexOf("===END_CREATE_CONTENT===");
          const rawBlock = endIdx !== -1 
            ? msg.content.slice(startIdx, endIdx + "===END_CREATE_CONTENT===".length)
            : msg.content.slice(startIdx);
          return { 
            contentFactoryPreset: toContentFactoryPreset(parsed), 
            rawCreateContentBlock: rawBlock 
          };
        }
      }
    }
    console.log("[AgentChatPanel] No CREATE_CONTENT found in messages");
    return { contentFactoryPreset: null, rawCreateContentBlock: null };
  }, [messages]);

  // State for render execution
  const [isRendering, setIsRendering] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

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
                <span className="ml-2 text-sm text-muted-foreground">Starting chat...</span>
              </div>
            ) : sending && messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-primary">Agent is thinking...</span>
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
                      
                      {/* NEW PRIMARY ACTIONS: Preview Blueprint / Render Now */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          className="w-full"
                          disabled={isPreviewing}
                          onClick={async () => {
                            if (!rawCreateContentBlock) return;
                            setIsPreviewing(true);
                            try {
                              const { data, error } = await supabase.functions.invoke("execute-create-content", {
                                body: {
                                  conversation_id: (context as any)?.conversationId ?? null,
                                  organization_id: (context as any)?.organizationId ?? null,
                                  requested_by: "user",
                                  agent: agentId || "noah_bennett",
                                  create_content_text: rawCreateContentBlock,
                                  mode: "preview",
                                },
                              });
                              if (error) {
                                toast.error(error.message);
                                return;
                              }
                              toast.success(`Blueprint validated (Job ${data.job_id})`, {
                                description: `Type: ${data.parsed?.content_type || 'content'} | Platform: ${data.parsed?.platform || 'unknown'}`,
                              });
                              console.log("[AgentChatPanel] Preview result:", data);
                            } catch (e) {
                              toast.error((e as Error).message);
                            } finally {
                              setIsPreviewing(false);
                            }
                          }}
                        >
                          {isPreviewing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          Preview
                        </Button>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          disabled={isRendering}
                          onClick={async () => {
                            if (!rawCreateContentBlock) return;
                            setIsRendering(true);
                            try {
                              const { data, error } = await supabase.functions.invoke("execute-create-content", {
                                body: {
                                  conversation_id: (context as any)?.conversationId ?? null,
                                  organization_id: (context as any)?.organizationId ?? null,
                                  requested_by: "user",
                                  agent: agentId || "noah_bennett",
                                  create_content_text: rawCreateContentBlock,
                                  mode: "execute",
                                },
                              });
                              if (error) {
                                toast.error(error.message);
                                return;
                              }
                              
                              if (data.queued_for_approval) {
                                toast.info("Queued for approval", {
                                  description: "Check the Review Queue to approve this render",
                                });
                              } else if (data.executed) {
                                toast.success("Render started!", {
                                  description: `Job ${data.job_id} is processing via ${data.usedFn}`,
                                });
                              } else {
                                toast.success(`Job created: ${data.job_id}`);
                              }
                              console.log("[AgentChatPanel] Execute result:", data);
                            } catch (e) {
                              toast.error((e as Error).message);
                            } finally {
                              setIsRendering(false);
                            }
                          }}
                        >
                          {isRendering ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Render Now
                        </Button>
                      </div>
                      
                      {/* Divider */}
                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-2 text-muted-foreground">or open in editor</span>
                        </div>
                      </div>
                      
                      {/* SECONDARY: Create as Locked ProducerJob in ReelBuilder */}
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          console.log('[AgentChatPanel] Creating locked ProducerJob from agent output');
                          toast.info('Loading clips from ContentBox...');
                          
                          let clips: ProducerJobClip[] = [];
                          
                          // 1. If attached_assets exist, use them directly
                          const attachedAssets = contentFactoryPreset.attached_assets || [];
                          if (attachedAssets.length > 0) {
                            clips = attachedAssets.map((asset, idx) => ({
                              id: `attached_${idx}_${Date.now()}`,
                              url: asset.url,
                              duration: 10,
                              trimStart: 0,
                              trimEnd: 10,
                              suggestedOverlay: contentFactoryPreset.overlays?.[idx]?.text,
                              reason: 'Agent attached asset',
                            }));
                          }
                          
                          // 2. If no attached assets but asset_query exists, query contentbox
                          if (clips.length === 0 && contentFactoryPreset.asset_query) {
                            const query = contentFactoryPreset.asset_query;
                            console.log('[AgentChatPanel] Querying contentbox with:', query);
                            
                            let dbQuery = supabase
                              .from('content_files')
                              .select('id, file_url, thumbnail_url, duration_seconds, original_filename, tags')
                              .eq('file_type', 'video')
                              .order('created_at', { ascending: false })
                              .limit(query.limit || 4);
                            
                            // Filter by tags if provided
                            if (query.tags && query.tags.length > 0) {
                              dbQuery = dbQuery.overlaps('tags', query.tags);
                            }
                            
                            const { data: videos, error } = await dbQuery;
                            
                            if (error) {
                              console.error('[AgentChatPanel] ContentBox query failed:', error);
                              toast.error('Failed to load clips from ContentBox');
                            } else if (videos && videos.length > 0) {
                              clips = videos.map((video, idx) => ({
                                id: video.id,
                                url: video.file_url,
                                thumbnail: video.thumbnail_url,
                                duration: video.duration_seconds || 10,
                                trimStart: 0,
                                trimEnd: Math.min(video.duration_seconds || 10, 5), // Default 5s per clip
                                suggestedOverlay: contentFactoryPreset.overlays?.[idx]?.text,
                                reason: `Matched tags: ${(video.tags as string[] || []).slice(0, 3).join(', ')}`,
                              }));
                              console.log('[AgentChatPanel] Found', clips.length, 'clips from ContentBox');
                            }
                          }
                          
                          // 3. If still no clips, try to get the most recent videos
                          if (clips.length === 0) {
                            console.log('[AgentChatPanel] No clips found, loading recent videos...');
                            const { data: recentVideos } = await supabase
                              .from('content_files')
                              .select('id, file_url, thumbnail_url, duration_seconds, original_filename')
                              .eq('file_type', 'video')
                              .order('created_at', { ascending: false })
                              .limit(4);
                            
                            if (recentVideos && recentVideos.length > 0) {
                              clips = recentVideos.map((video, idx) => ({
                                id: video.id,
                                url: video.file_url,
                                thumbnail: video.thumbnail_url,
                                duration: video.duration_seconds || 10,
                                trimStart: 0,
                                trimEnd: Math.min(video.duration_seconds || 10, 5),
                                suggestedOverlay: contentFactoryPreset.overlays?.[idx]?.text,
                                reason: 'Most recent video',
                              }));
                            }
                          }
                          
                          if (clips.length === 0) {
                            toast.error('No video clips found. Please upload some videos first.');
                            return;
                          }
                          
                          // 4. Build the locked ProducerJob
                          const overlays: ProducerJobOverlay[] = (contentFactoryPreset.overlays || []).map(o => ({
                            text: o.text,
                            start: o.start,
                            duration: o.duration,
                            position: 'center' as const,
                            style: 'bold' as const,
                          }));
                          
                          const producerJob: ProducerJob = {
                            source: 'agent',
                            agentId: agentId || undefined,
                            platform: (contentFactoryPreset.platform as 'instagram' | 'tiktok' | 'youtube' | 'facebook') || 'instagram',
                            contentType: (contentFactoryPreset.content_type as 'reel' | 'story' | 'short') || 'reel',
                            clips,
                            overlays,
                            hook: contentFactoryPreset.hook,
                            cta: contentFactoryPreset.cta,
                            caption: contentFactoryPreset.caption,
                            hashtags: Array.isArray(contentFactoryPreset.hashtags) 
                              ? contentFactoryPreset.hashtags 
                              : (contentFactoryPreset.hashtags as unknown as string)?.split(/[,\s]+/).filter(Boolean),
                            musicStyle: 'upbeat',
                            lock: true, // 🔒 CRITICAL: No auto-create will run
                            createdAt: new Date().toISOString(),
                          };
                          
                          console.log('[AgentChatPanel] ProducerJob created:', producerJob);
                          
                          // 5. Create content_calendar draft entry
                          let content_calendar_id: string | undefined;
                          try {
                            content_calendar_id = await createCalendarDraftFromPreset({
                              brand: 'wpw',
                              platform: contentFactoryPreset.platform,
                              content_type: contentFactoryPreset.content_type,
                              hook: contentFactoryPreset.hook,
                              caption: contentFactoryPreset.caption,
                              hashtags: contentFactoryPreset.hashtags,
                            });
                            console.log('[AgentChatPanel] Created calendar draft:', content_calendar_id);
                          } catch (calErr) {
                            console.error('[AgentChatPanel] Failed to create calendar entry:', calErr);
                            // Continue anyway - calendar entry is optional
                          }
                          
                          toast.success(`Loaded ${clips.length} clips with ${overlays.length} overlays`);
                          
                          // 6. Navigate to ReelBuilder with the locked job + calendar ID
                          navigate('/organic/reel-builder', {
                            state: {
                              producerJob,
                              skipAutoCreate: true,
                              content_calendar_id,
                            },
                          });
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create in ReelBuilder
                      </Button>
                      
                      {/* Secondary: Open in MightyEdit (legacy single-video flow) */}
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          // Original MightyEdit flow for single video edits
                          const attachedAssets = contentFactoryPreset.attached_assets || [];
                          let claimedAssetId: string | null = null;
                          
                          if (attachedAssets.length > 0) {
                            try {
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
                              
                              if (!error) {
                                claimedAssetId = asset.id;
                              }
                            } catch (e) {
                              console.error('[AgentChatPanel] Error claiming asset:', e);
                            }
                          }
                          
                          const presetWithAssets = {
                            ...contentFactoryPreset,
                            attached_assets: attachedAssets,
                            claimed_asset_id: claimedAssetId,
                          };
                          sessionStorage.setItem('mightyedit_preset', JSON.stringify(presetWithAssets));
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

  // 🔧 FIX: Strip internal blocks from agent messages so users see natural language
  const displayContent = isUser 
    ? message.content 
    : stripInternalBlocksForDisplay(message.content);

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
        <div className="whitespace-pre-wrap">{displayContent}</div>
        
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
