import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioMediaUploadDialog } from "./PortfolioMediaUploadDialog";

interface BeforePhotosPromptProps {
  shopflowOrderId: string;
  orderNumber: string;
  customerName: string;
  vehicleInfo?: {
    year?: number;
    make?: string;
    model?: string;
  };
  onComplete?: () => void;
}

export function BeforePhotosPrompt({
  shopflowOrderId,
  orderNumber,
  customerName,
  vehicleInfo,
  onComplete,
}: BeforePhotosPromptProps) {
  const [portfolioJob, setPortfolioJob] = useState<any>(null);
  const [beforePhotosCount, setBeforePhotosCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchPortfolioData();
  }, [shopflowOrderId]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      // Find portfolio job for this order
      const { data: job, error: jobError } = await supabase
        .from("portfolio_jobs")
        .select("*")
        .eq("shopflow_order_id", shopflowOrderId)
        .maybeSingle();

      if (jobError) throw jobError;
      setPortfolioJob(job);

      if (job) {
        // Count before photos
        const { count, error: mediaError } = await supabase
          .from("portfolio_media")
          .select("*", { count: "exact", head: true })
          .eq("job_id", job.id)
          .eq("media_type", "before");

        if (!mediaError) {
          setBeforePhotosCount(count || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching portfolio data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setIsUploadDialogOpen(false);
    fetchPortfolioData();
    onComplete?.();
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      </Card>
    );
  }

  // If we have before photos, show success state
  if (beforePhotosCount > 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Before Photos Captured
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {beforePhotosCount} photo{beforePhotosCount !== 1 ? "s" : ""}
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Great! You can start the wrap installation now.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            Add More
          </Button>
        </div>

        {portfolioJob && (
          <PortfolioMediaUploadDialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
            jobId={portfolioJob.id}
            onSuccess={handleUploadComplete}
          />
        )}
      </Card>
    );
  }

  // No portfolio job yet - prompt to create one
  if (!portfolioJob) {
    return (
      <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 rounded-full flex-shrink-0">
            <Camera className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              📸 Take Before Photos First!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Document the vehicle's condition before starting the wrap. This protects you and creates portfolio content.
            </p>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>• Capture all angles: front, back, sides, 3/4 views</p>
              <p>• Document any existing damage or imperfections</p>
              <p>• Good lighting is essential for quality photos</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">
          Portfolio job will be created when order moves to "Processing" status.
        </p>
      </Card>
    );
  }

  // Portfolio job exists but no before photos yet - show urgent prompt
  return (
    <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 animate-pulse-slow">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/20 rounded-full flex-shrink-0">
          <Camera className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            📸 Take Before Photos First!
            <Badge variant="destructive" className="text-xs">Required</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Document the vehicle before starting the wrap for{" "}
            <span className="text-foreground font-medium">{customerName}</span>
            {vehicleInfo?.year && vehicleInfo?.make && vehicleInfo?.model && (
              <span className="text-foreground">
                {" "}
                - {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
              </span>
            )}
          </p>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p>• Capture all angles: front, back, sides, 3/4 views</p>
            <p>• Document any existing damage or imperfections</p>
            <p>• Good lighting is essential for quality photos</p>
          </div>
        </div>
      </div>
      
      <Button 
        className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        onClick={() => setIsUploadDialogOpen(true)}
      >
        <Camera className="w-4 h-4 mr-2" />
        Upload Before Photos
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <PortfolioMediaUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        jobId={portfolioJob.id}
        onSuccess={handleUploadComplete}
      />
    </Card>
  );
}
