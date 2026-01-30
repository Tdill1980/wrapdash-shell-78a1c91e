import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  Download, 
  FileImage, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Receipt,
  Palette,
  Car,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Send,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArtworkReview {
  id: string;
  action_type: string;
  conversation_id: string | null;
  action_payload: {
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    file_size_formatted?: string;
    customer_email?: string | null;
    vehicle_info?: {
      year?: string;
      make?: string;
      model?: string;
      sqft?: number;
    } | null;
    session_id?: string;
    submitted_at?: string;
    ai_precheck?: {
      preliminary_score: number;
      quick_issues: string[];
      file_type_ok: boolean;
      file_type_label: string;
      size_assessment: string;
    };
    // For file_review action type (from chat widget)
    analysis?: string;
    file_types?: string[];
  };
  created_at: string;
  resolved: boolean;
  status: string;
}

interface ConversationMessage {
  id: string;
  content: string;
  direction: string;
  created_at: string;
}

interface ConversationData {
  id: string;
  chat_state: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    vehicle?: {
      year?: string;
      make?: string;
      model?: string;
    };
  } | null;
  messages: ConversationMessage[];
}

interface ArtworkReviewsPanelProps {
  onOpenReply?: (customerEmail: string, context: string) => void;
}

export function ArtworkReviewsPanel({ onOpenReply }: ArtworkReviewsPanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  const [showResolved, setShowResolved] = useState(false);
  const queryClient = useQueryClient();

  // Fetch both file_review AND artwork_review action types
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['artwork-reviews', showResolved],
    queryFn: async () => {
      let query = supabase
        .from('ai_actions')
        .select('*')
        .in('action_type', ['file_review', 'artwork_review'])
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (!showResolved) {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as ArtworkReview[];
    },
    refetchInterval: 30000,
  });

  // Fetch conversation data for reviews that have conversation_id
  const { data: conversationsMap } = useQuery({
    queryKey: ['artwork-review-conversations', reviews?.map(r => r.conversation_id).filter(Boolean)],
    queryFn: async () => {
      const conversationIds = reviews?.map(r => r.conversation_id).filter(Boolean) as string[];
      if (!conversationIds.length) return {};

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          chat_state,
          messages (
            id,
            content,
            direction,
            created_at
          )
        `)
        .in('id', conversationIds)
        .order('created_at', { ascending: true, referencedTable: 'messages' });

      if (error) throw error;
      
      const map: Record<string, ConversationData> = {};
      for (const conv of (data || [])) {
        map[conv.id] = conv as unknown as ConversationData;
      }
      return map;
    },
    enabled: !!reviews?.length,
  });

  const handleResolve = async (reviewId: string) => {
    setProcessingId(reviewId);
    try {
      const { error } = await supabase
        .from('ai_actions')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', reviewId);

      if (error) throw error;
      
      toast.success('Review marked as resolved');
      queryClient.invalidateQueries({ queryKey: ['artwork-reviews'] });
    } catch (err) {
      console.error('Failed to resolve review:', err);
      toast.error('Failed to resolve review');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleTranscript = (reviewId: string) => {
    setExpandedTranscripts(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 7) return '✓';
    if (score >= 4) return '⚠️';
    return '❌';
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get customer email - try payload first, then conversation
  const getCustomerEmail = (review: ArtworkReview): string | null => {
    if (review.action_payload?.customer_email) {
      return review.action_payload.customer_email;
    }
    if (review.conversation_id && conversationsMap?.[review.conversation_id]) {
      return conversationsMap[review.conversation_id].chat_state?.customer_email || null;
    }
    return null;
  };

  // Get vehicle info - try payload first, then conversation
  const getVehicleInfo = (review: ArtworkReview) => {
    if (review.action_payload?.vehicle_info) {
      return review.action_payload.vehicle_info;
    }
    if (review.conversation_id && conversationsMap?.[review.conversation_id]) {
      return conversationsMap[review.conversation_id].chat_state?.vehicle || null;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">No {showResolved ? '' : 'Pending '}Artwork Reviews</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {showResolved ? 'No artwork reviews found' : 'All artwork submissions have been reviewed'}
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? 'Show Pending Only' : 'Show All Reviews'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            Artwork Reviews
            <Badge variant="secondary" className="ml-2">{reviews.length}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? 'Pending Only' : 'Show All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="divide-y">
            {reviews.map((review) => {
              const payload = review.action_payload;
              const precheck = payload.ai_precheck;
              const vehicle = getVehicleInfo(review);
              const customerEmail = getCustomerEmail(review);
              const isProcessing = processingId === review.id;
              const isExpanded = expandedTranscripts.has(review.id);
              const conversation = review.conversation_id ? conversationsMap?.[review.conversation_id] : null;
              const fileName = payload.file_name || 'Unknown file';
              const fileUrl = payload.file_url;

              return (
                <div key={review.id} className={`p-4 hover:bg-muted/50 transition-colors ${review.resolved ? 'opacity-60' : ''}`}>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={review.action_type === 'file_review' ? 'default' : 'secondary'}>
                        {review.action_type === 'file_review' ? 'Chat File' : 'Artwork Review'}
                      </Badge>
                      {review.resolved && (
                        <Badge variant="outline" className="text-green-500 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(review.created_at)}
                    </span>
                  </div>

                  {/* File Preview + Info */}
                  <div className="flex gap-4">
                    {/* Thumbnail/Icon */}
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {fileUrl && isImageFile(fileName) ? (
                        <img 
                          src={fileUrl} 
                          alt={fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <div>
                        <h4 className="font-medium text-sm truncate max-w-[250px]">
                          {fileName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {precheck?.file_type_label || payload.file_types?.join(', ') || 'File'} 
                          {payload.file_size_formatted && ` • ${payload.file_size_formatted}`}
                        </p>
                      </div>

                      {/* Customer Email */}
                      {customerEmail && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{customerEmail}</span>
                        </div>
                      )}

                      {/* Vehicle Info */}
                      {vehicle && (vehicle.year || vehicle.make || vehicle.model) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Car className="h-3 w-3" />
                          <span>
                            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                            {'sqft' in vehicle && vehicle.sqft && ` (${vehicle.sqft} sq ft)`}
                          </span>
                        </div>
                      )}

                      {/* AI Score (if available) */}
                      {precheck && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getScoreColor(precheck.preliminary_score)}`}
                          >
                            {getScoreEmoji(precheck.preliminary_score)} Score: {precheck.preliminary_score}/10
                          </Badge>
                          {precheck.quick_issues.length > 0 && (
                            <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {precheck.quick_issues.length} issue{precheck.quick_issues.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* AI Analysis (for file_review type) */}
                      {payload.analysis && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {payload.analysis}
                        </p>
                      )}

                      {/* Issues List */}
                      {precheck?.quick_issues && precheck.quick_issues.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {precheck.quick_issues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-yellow-500">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Chat Transcript (Collapsible) */}
                  {conversation && conversation.messages && conversation.messages.length > 0 && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleTranscript(review.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-3 gap-1.5 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          <MessageSquare className="h-3 w-3" />
                          View Chat Transcript ({conversation.messages.length} messages)
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-muted/50 rounded-lg max-h-[300px] overflow-y-auto space-y-2">
                          {conversation.messages.map((msg) => (
                            <div key={msg.id} className="text-sm">
                              <span className={msg.direction === 'inbound' ? 'text-blue-500 font-medium' : 'text-green-500 font-medium'}>
                                {msg.direction === 'inbound' ? 'Customer' : 'Jordan'}:
                              </span>{' '}
                              <span className="text-foreground">{msg.content}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5"
                      >
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3 w-3" />
                          View File
                        </a>
                      </Button>
                    )}

                    {fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5"
                      >
                        <a href={fileUrl} download={fileName}>
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      </Button>
                    )}

                    {customerEmail && onOpenReply && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => onOpenReply(
                            customerEmail,
                            `Hi! Thanks for sending your file "${fileName}".\n\nI've reviewed it and it looks great - ready for printing!\n\nWant me to generate a quote for your wrap project?`
                          )}
                        >
                          <Send className="h-3 w-3" />
                          Reply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => onOpenReply(
                            customerEmail,
                            `Your file "${fileName}" looks great and is ready for printing!\n\nReady to order? Get a quote for your wrap here: https://weprintwraps.com/quote`
                          )}
                        >
                          <Receipt className="h-3 w-3" />
                          Send Quote Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => onOpenReply(
                            customerEmail,
                            `Thank you for submitting "${fileName}" for review.\n\nAfter checking your file, it looks like it needs some adjustments before it's print-ready. Our design team can prepare your artwork for production starting at $75.\n\nLearn more about our design services: https://weprintwraps.com/design-services`
                          )}
                        >
                          <Palette className="h-3 w-3" />
                          Send Design Fee
                        </Button>
                      </>
                    )}

                    {!review.resolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 ml-auto"
                        onClick={() => handleResolve(review.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Mark Reviewed
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}