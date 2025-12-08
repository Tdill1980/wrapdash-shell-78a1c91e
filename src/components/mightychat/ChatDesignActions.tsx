import { useState } from "react";
import { Palette, Box, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAIDesignGenerator, DesignStyle } from "@/hooks/useAIDesignGenerator";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface ChatDesignActionsProps {
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  lastVehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
}

const DESIGN_STYLES: { value: DesignStyle; label: string }[] = [
  { value: "luxury", label: "Luxury / Premium" },
  { value: "bold", label: "Bold / Aggressive" },
  { value: "camo", label: "Camo / Tactical" },
  { value: "abstract", label: "Abstract / Artistic" },
  { value: "gradient", label: "Gradient / Flow" },
  { value: "corporate", label: "Corporate / Fleet" },
  { value: "custom", label: "Custom Direction" },
];

export const ChatDesignActions = ({
  contactId,
  contactName,
  contactEmail,
  lastVehicle,
}: ChatDesignActionsProps) => {
  const { organizationId } = useOrganization();
  const { generateDesign, isGenerating, designResult } = useAIDesignGenerator();
  
  const [showDialog, setShowDialog] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>("luxury");
  const [notes, setNotes] = useState("");

  const hasVehicle = lastVehicle?.make && lastVehicle?.model;

  const handleGenerateDesign = async () => {
    if (!organizationId || !hasVehicle) {
      toast.error("Missing vehicle or organization data");
      return;
    }

    await generateDesign({
      organization_id: organizationId,
      contact_id: contactId,
      vehicle: {
        year: lastVehicle.year || "",
        make: lastVehicle.make || "",
        model: lastVehicle.model || "",
      },
      style: selectedStyle,
      notes: notes || undefined,
      customer_name: contactName,
      customer_email: contactEmail,
    });
  };

  const handleOpenDialog = () => {
    if (!hasVehicle) {
      toast.error("No vehicle data available for this contact");
      return;
    }
    setShowDialog(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          disabled={!hasVehicle}
          className="gap-2"
        >
          <Palette className="w-4 h-4" />
          Generate Concept
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          disabled={!hasVehicle}
          className="gap-2"
        >
          <Box className="w-4 h-4" />
          3D Preview
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Generate AI Design
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Vehicle Info */}
            {hasVehicle && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  {lastVehicle.year} {lastVehicle.make} {lastVehicle.model}
                </p>
                {contactName && (
                  <p className="text-xs text-muted-foreground">For: {contactName}</p>
                )}
              </div>
            )}

            {/* Style Selection */}
            <div className="space-y-2">
              <Label>Design Style</Label>
              <Select value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as DesignStyle)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Custom Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific colors, themes, or requirements..."
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateDesign}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Design...
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4 mr-2" />
                  Generate Design
                </>
              )}
            </Button>

            {/* Results */}
            {designResult && (
              <div className="space-y-3 pt-3 border-t border-border">
                <p className="text-sm font-medium text-primary">
                  {designResult.design_concept?.design_title || "Design Ready!"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {designResult.ai_message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.open(designResult.portal_url, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in ApproveFlow
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};