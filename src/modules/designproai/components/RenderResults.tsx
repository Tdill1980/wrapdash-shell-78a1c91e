import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, FileText, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RenderJob {
  angle: string;
  status: "pending" | "generating" | "complete" | "error";
  imageUrl?: string;
  error?: string;
}

interface RenderResultsProps {
  heroImageUrl?: string;
  backgroundJobs: RenderJob[];
  visualizationId?: string | null;
  renderUrls?: Record<string, string>;
  vehicleInfo?: { make: string; model: string; year: number; type: string };
  colorInfo?: { hex: string; name: string };
}

const ANGLE_LABELS: Record<string, string> = {
  hero: "Hero Shot",
  side: "Side View",
  rear: "Rear View",
  detail: "Detail Shot",
};

export const RenderResults = ({ 
  heroImageUrl, 
  backgroundJobs, 
  visualizationId, 
  renderUrls, 
  vehicleInfo, 
  colorInfo 
}: RenderResultsProps) => {
  const navigate = useNavigate();

  if (!heroImageUrl && backgroundJobs.length === 0) {
    return null;
  }

  const allComplete = backgroundJobs.every(job => job.status === "complete");

  const handleSendToApproveFlow = async () => {
    if (!visualizationId || !vehicleInfo) return;

    try {
      // Create ApproveFlow project
      const { data: project, error } = await supabase
        .from("approveflow_projects")
        .insert({
          customer_name: "WrapCloser Generated",
          order_number: `WC-${Date.now()}`,
          product_type: `${vehicleInfo.type} Wrap`,
          status: "design_requested",
          design_instructions: `Generated from WrapCloser: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Add 3D renders to ApproveFlow
      if (renderUrls) {
        await supabase.from("approveflow_3d").insert({
          project_id: project.id,
          render_urls: renderUrls,
        });
      }

      toast.success("Sent to ApproveFlow!");
      navigate(`/approveflow/${project.id}`);
    } catch (error) {
      console.error("Error sending to ApproveFlow:", error);
      toast.error("Failed to send to ApproveFlow");
    }
  };

  const handleAddToQuote = () => {
    if (!vehicleInfo || !colorInfo) return;
    
    // Navigate to MightyCustomer with pre-filled data
    const params = new URLSearchParams({
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      year: vehicleInfo.year.toString(),
      color: colorInfo.name,
    });
    
    navigate(`/mighty-customer?${params}`);
    toast.success("Opening quote builder...");
  };

  const handleViewInDesignVault = () => {
    navigate("/designvault");
    toast.success("View your render in DesignVault");
  };

  return (
    <div className="space-y-6">
      {heroImageUrl && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-purple bg-clip-text text-transparent">
            Your 3D Wrap Visualization
          </h3>
          <img
            src={heroImageUrl}
            alt="Hero render"
            className="w-full rounded-xl mb-4"
          />
          
          {allComplete && visualizationId && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <Button
                onClick={handleSendToApproveFlow}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Send to ApproveFlow
              </Button>
              <Button
                onClick={handleAddToQuote}
                variant="outline"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Add to Quote
              </Button>
              <Button
                onClick={handleViewInDesignVault}
                variant="outline"
                size="sm"
              >
                <Package className="w-4 h-4 mr-2" />
                View in Vault
              </Button>
            </div>
          )}
        </Card>
      )}

      {backgroundJobs.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4">Additional Angles</h3>
          <div className="grid grid-cols-2 gap-4">
            {backgroundJobs.map((job) => (
              <div
                key={job.angle}
                className="relative aspect-video bg-surface rounded-lg overflow-hidden border border-border"
              >
                {job.status === "complete" && job.imageUrl ? (
                  <>
                    <img
                      src={job.imageUrl}
                      alt={ANGLE_LABELS[job.angle]}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {ANGLE_LABELS[job.angle]}
                    </div>
                  </>
                ) : job.status === "error" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-destructive text-center px-4">
                      {job.error || "Failed to generate"}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      {job.status === "pending" ? "Queued" : "Generating"}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ANGLE_LABELS[job.angle]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
