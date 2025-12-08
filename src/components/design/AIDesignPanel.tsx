import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wand2, Palette, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { useAIDesignGenerator, DesignStyle } from "@/hooks/useAIDesignGenerator";
import { useNavigate } from "react-router-dom";

interface AIDesignPanelProps {
  vehicle: {
    year: string;
    make: string;
    model: string;
  };
  organizationId: string;
  customerName?: string;
  customerEmail?: string;
  contactId?: string;
}

const DESIGN_STYLES: { value: DesignStyle; label: string; description: string }[] = [
  { value: "luxury", label: "Luxury", description: "Elegant, high-end finish" },
  { value: "bold", label: "Bold", description: "Eye-catching, vibrant colors" },
  { value: "gradient", label: "Gradient", description: "Smooth color transitions" },
  { value: "camo", label: "Camo", description: "Tactical, military-inspired" },
  { value: "abstract", label: "Abstract", description: "Artistic, unique patterns" },
  { value: "corporate", label: "Corporate", description: "Professional, branded look" },
  { value: "custom", label: "Custom", description: "Describe your vision" },
];

export function AIDesignPanel({
  vehicle,
  organizationId,
  customerName,
  customerEmail,
  contactId,
}: AIDesignPanelProps) {
  const navigate = useNavigate();
  const { generateDesign, isGenerating, designResult, clearResult } = useAIDesignGenerator();
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>("bold");
  const [notes, setNotes] = useState("");

  const handleGenerateDesign = async () => {
    if (!vehicle.make || !vehicle.model) {
      return;
    }

    await generateDesign({
      organization_id: organizationId,
      contact_id: contactId,
      vehicle,
      style: selectedStyle,
      notes: notes || undefined,
      customer_name: customerName,
      customer_email: customerEmail,
    });
  };

  const handleOpenApproveFlow = () => {
    if (designResult?.approveflow_id) {
      navigate(`/approveflow/${designResult.approveflow_id}`);
    }
  };

  const isVehicleSelected = vehicle.make && vehicle.model;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <span>AI Design Tools</span>
          <Badge variant="secondary" className="text-[10px]">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Style Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Design Style</label>
          <Select value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as DesignStyle)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a style" />
            </SelectTrigger>
            <SelectContent>
              {DESIGN_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{style.label}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Design Notes (Optional)</label>
          <Textarea
            placeholder="Describe specific colors, patterns, or ideas..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px] text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleGenerateDesign}
            disabled={!isVehicleSelected || isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Concept...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Wrap Concept
              </>
            )}
          </Button>
          
          {!isVehicleSelected && (
            <p className="text-xs text-muted-foreground text-center">
              Select a vehicle first to generate designs
            </p>
          )}
        </div>

        {/* Design Result */}
        {designResult && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-500" />
                {designResult.design_concept.design_title}
              </h4>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Created
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {designResult.design_concept.design_description}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Color Palette</p>
              <div className="flex flex-wrap gap-1">
                {designResult.design_concept.color_palette.map((color, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Design Elements</p>
              <div className="flex flex-wrap gap-1">
                {designResult.design_concept.design_elements.map((element, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {element}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                size="sm"
                onClick={handleOpenApproveFlow}
                className="flex-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open in ApproveFlow
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearResult}
              >
                New Design
              </Button>
            </div>

            <p className="text-xs text-muted-foreground italic">
              Order #{designResult.order_number}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
