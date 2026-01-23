import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArtworkReview {
  id: string;
  action_payload: {
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_size_formatted: string;
    customer_email: string | null;
    vehicle_info: {
      year?: string;
      make?: string;
      model?: string;
      sqft?: number;
    } | null;
    session_id: string;
    submitted_at: string;
    ai_precheck: {
      preliminary_score: number;
      quick_issues: string[];
      file_type_ok: boolean;
      file_type_label: string;
      size_assessment: string;
    };
  };
  created_at: string;
  resolved: boolean;
  status: string;
}

interface ArtworkReviewsPanelProps {
  onOpenReply?: (customerEmail: string, context: string) => void;
}

export function ArtworkReviewsPanel({ onOpenReply }: ArtworkReviewsPanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['artwork-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_actions')
        .select('*')
        .eq('action_type', 'artwork_review')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ArtworkReview[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
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
          <h3 className="font-semibold mb-1">No Pending Artwork Reviews</h3>
          <p className="text-sm text-muted-foreground">
            All artwork submissions have been reviewed
          </p>
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
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="divide-y">
            {reviews.map((review) => {
              const payload = review.action_payload;
              const precheck = payload.ai_precheck;
              const vehicle = payload.vehicle_info;
              const isProcessing = processingId === review.id;

              return (
                <div key={review.id} className="p-4 hover:bg-muted/50 transition-colors">
                  {/* File Preview + Info */}
                  <div className="flex gap-4">
                    {/* Thumbnail/Icon */}
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {isImageFile(payload.file_name) ? (
                        <img 
                          src={payload.file_url} 
                          alt={payload.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm truncate max-w-[200px]">
                            {payload.file_name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {precheck.file_type_label} • {payload.file_size_formatted}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(review.created_at)}
                        </span>
                      </div>

                      {/* Customer Email */}
                      {payload.customer_email && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{payload.customer_email}</span>
                        </div>
                      )}

                      {/* Vehicle Info */}
                      {vehicle && (vehicle.year || vehicle.make || vehicle.model) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Car className="h-3 w-3" />
                          <span>
                            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                            {vehicle.sqft && ` (${vehicle.sqft} sq ft)`}
                          </span>
                        </div>
                      )}

                      {/* AI Score */}
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

                      {/* Issues List */}
                      {precheck.quick_issues.length > 0 && (
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

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1.5"
                    >
                      <a href={payload.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                    </Button>

                    {payload.customer_email && onOpenReply && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => onOpenReply(
                            payload.customer_email!,
                            `Your file "${payload.file_name}" looks great and is ready for printing!\n\nReady to order? Get a quote for your wrap here: https://weprintwraps.com/quote`
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
                            payload.customer_email!,
                            `Thank you for submitting "${payload.file_name}" for review.\n\nAfter checking your file, it looks like it needs some adjustments before it's print-ready. Our design team can prepare your artwork for production starting at $75.\n\nLearn more about our design services: https://weprintwraps.com/design-services`
                          )}
                        >
                          <Palette className="h-3 w-3" />
                          Send Design Fee
                        </Button>
                      </>
                    )}

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
