import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DesignVisualization } from "../hooks/useDesignVault";
import { Package, FileCheck, DollarSign } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";

interface DesignDetailModalProps {
  design: DesignVisualization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DesignDetailModal = ({
  design,
  open,
  onOpenChange,
}: DesignDetailModalProps) => {
  const { toast } = useToast();
  const { organizationId } = useOrganization();
  const [isCreatingKit, setIsCreatingKit] = useState(false);

  if (!design) return null;

  const renderUrls = design.render_urls as Record<string, string> | null;
  const views = renderUrls
    ? Object.entries(renderUrls).map(([key, url]) => ({ key, url }))
    : [];

  const handleSendToWrapBox = async () => {
    setIsCreatingKit(true);
    try {
      const { data, error } = await supabase.from("wrapbox_kits").insert({
        design_vault_id: design.id,
        organization_id: organizationId,
        vehicle_json: {
          make: design.vehicle_make,
          model: design.vehicle_model,
          year: design.vehicle_year,
          type: design.vehicle_type,
        },
        tags: design.tags || [],
        status: "Draft",
      }).select().single();

      if (error) throw error;

      toast({
        title: "Print Kit Created",
        description: "Design has been sent to WrapBox.",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create print kit.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingKit(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {design.vehicle_year} {design.vehicle_make} {design.vehicle_model}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Render Views Grid */}
          <div className="grid grid-cols-2 gap-4">
            {views.map(({ key, url }) => (
              <div key={key} className="space-y-2">
                <p className="text-sm text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <img
                  src={url}
                  alt={key}
                  className="w-full rounded-lg border border-border"
                />
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Color</p>
              <div className="flex items-center gap-2 mt-1">
                {design.color_hex && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-border"
                    style={{ backgroundColor: design.color_hex }}
                  />
                )}
                <span className="font-medium">
                  {design.color_name || design.color_hex}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finish Type</p>
              <p className="font-medium capitalize mt-1">
                {design.finish_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehicle Type</p>
              <p className="font-medium capitalize mt-1">
                {design.vehicle_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium mt-1">
                {new Date(design.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tags */}
          {design.tags && design.tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {design.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-gradient-purple text-white"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleSendToWrapBox}
              disabled={isCreatingKit}
              className="flex-1 bg-gradient-purple hover:opacity-90"
            >
              <Package className="w-4 h-4 mr-2" />
              Send to WrapBox
            </Button>
            <Button variant="outline" className="flex-1">
              <FileCheck className="w-4 h-4 mr-2" />
              Send to ApproveFlow
            </Button>
            <Button variant="outline" className="flex-1">
              <DollarSign className="w-4 h-4 mr-2" />
              Add to Quote
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
