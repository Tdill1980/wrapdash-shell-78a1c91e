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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0A0A0F] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {design.vehicle_year} {design.vehicle_make} {design.vehicle_model}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {design.color_name} • {design.finish_type}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Large Hero Render */}
          <div className="relative w-full rounded-lg overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-200 p-8">
            <img
              src={renderUrls?.hero || "/placeholder.svg"}
              alt="Hero View"
              className="w-full h-auto object-contain"
              style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.2))' }}
            />
          </div>

          {/* Additional Views Grid */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Additional Views
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {views.filter(({ key }) => key !== 'hero').map(({ key, url }) => (
                <div key={key} className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {key.replace(/_/g, " ")}
                  </p>
                  <div className="rounded-md overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-200 p-3 border border-white/5">
                    <img
                      src={url}
                      alt={key}
                      className="w-full h-auto object-contain"
                      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Details Grid */}
          <div className="bg-[#121218] border border-white/5 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Design Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Color</p>
                <div className="flex items-center gap-2">
                  {design.color_hex && (
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white/10"
                      style={{ backgroundColor: design.color_hex }}
                    />
                  )}
                  <span className="text-xs font-medium text-foreground">
                    {design.color_name || design.color_hex}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Finish Type</p>
                <p className="text-xs font-medium text-foreground capitalize">
                  {design.finish_type}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Vehicle Type</p>
                <p className="text-xs font-medium text-foreground capitalize">
                  {design.vehicle_type}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Created</p>
                <p className="text-xs font-medium text-foreground">
                  {new Date(design.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {design.tags && design.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {design.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    className="bg-[#121218] border-purple-500/30 text-foreground text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5">
            <Button
              onClick={handleSendToWrapBox}
              disabled={isCreatingKit}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 text-sm h-10"
            >
              <Package className="w-4 h-4 mr-2" />
              Generate Print Pack
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 bg-[#121218] border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-sm h-10"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              View All Sides
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 bg-[#121218] border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-sm h-10"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Save to Vault
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
