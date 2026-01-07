// ============================================
// ApproveFlow OS — Designer Production Specs Panel
// ============================================
// OS RULES:
// 1. Designers ENTER production specs here
// 2. Required fields: Total SQ FT, Wrap Scope
// 3. Optional fields have N/A toggles
// 4. "Generate Approval Proof" button ONLY enabled when all required fields + 3D renders exist
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Rocket
} from "lucide-react";

const WRAP_SCOPE_OPTIONS = [
  "Full Wrap",
  "Partial Wrap", 
  "Color Change",
  "Commercial Fleet",
  "Racing Livery",
  "Accents Only",
  "Roof Wrap",
  "Hood/Trunk",
  "Custom"
];

export interface ProductionSpecsData {
  totalSqFt: number | null;
  wrapScope: string | null;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  wheelbase: string;
  wheelbaseIsNa: boolean;
  roofHeight: string;
  roofHeightIsNa: boolean;
  bodyLength: string;
  bodyLengthIsNa: boolean;
  scaleReference: string;
  scaleReferenceIsNa: boolean;
  panelCount: number | null;
  panelCountIsNa: boolean;
  internalNotes: string;
}

interface DesignerProductionSpecsProps {
  projectId: string;
  orderNumber: string;
  vehicleInfo?: {
    year?: string;
    make?: string;
    model?: string;
  };
  has3DRenders: boolean;
  existingProofVersionId?: string;
  onGenerateProof: (specs: ProductionSpecsData) => Promise<void>;
  isGenerating: boolean;
}

export function DesignerProductionSpecs({
  projectId,
  orderNumber,
  vehicleInfo,
  has3DRenders,
  existingProofVersionId,
  onGenerateProof,
  isGenerating,
}: DesignerProductionSpecsProps) {
  // Form state
  const [specs, setSpecs] = useState<ProductionSpecsData>({
    totalSqFt: null,
    wrapScope: null,
    vehicleYear: vehicleInfo?.year || "",
    vehicleMake: vehicleInfo?.make || "",
    vehicleModel: vehicleInfo?.model || "",
    wheelbase: "",
    wheelbaseIsNa: false,
    roofHeight: "",
    roofHeightIsNa: false,
    bodyLength: "",
    bodyLengthIsNa: false,
    scaleReference: "",
    scaleReferenceIsNa: false,
    panelCount: null,
    panelCountIsNa: false,
    internalNotes: "",
  });

  // Update vehicle info when prop changes
  useEffect(() => {
    if (vehicleInfo) {
      setSpecs(prev => ({
        ...prev,
        vehicleYear: vehicleInfo.year || prev.vehicleYear,
        vehicleMake: vehicleInfo.make || prev.vehicleMake,
        vehicleModel: vehicleInfo.model || prev.vehicleModel,
      }));
    }
  }, [vehicleInfo]);

  // Validation
  const validationErrors: string[] = [];
  
  if (!has3DRenders) {
    validationErrors.push("3D renders required");
  }
  if (!specs.totalSqFt || specs.totalSqFt <= 0) {
    validationErrors.push("Total SQ FT required");
  }
  if (!specs.wrapScope) {
    validationErrors.push("Wrap Scope required");
  }

  const isValid = validationErrors.length === 0;

  const handleGenerateProof = async () => {
    if (!isValid) return;
    await onGenerateProof(specs);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Production Specifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Fields Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-foreground">Required</span>
            <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">
              Must complete
            </Badge>
          </div>

          {/* Total SQ FT */}
          <div className="space-y-1.5">
            <Label htmlFor="totalSqFt" className="text-xs">
              Total SQ FT <span className="text-destructive">*</span>
            </Label>
            <Input
              id="totalSqFt"
              type="number"
              placeholder="e.g., 250"
              value={specs.totalSqFt || ""}
              onChange={(e) => setSpecs({ ...specs, totalSqFt: e.target.value ? Number(e.target.value) : null })}
              className="h-8 text-xs"
            />
          </div>

          {/* Wrap Scope */}
          <div className="space-y-1.5">
            <Label htmlFor="wrapScope" className="text-xs">
              Wrap Scope <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={specs.wrapScope || ""} 
              onValueChange={(value) => setSpecs({ ...specs, wrapScope: value })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select scope..." />
              </SelectTrigger>
              <SelectContent>
                {WRAP_SCOPE_OPTIONS.map((scope) => (
                  <SelectItem key={scope} value={scope} className="text-xs">
                    {scope}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vehicle Info Section */}
        <div className="space-y-3 pt-3 border-t border-border">
          <span className="text-xs font-semibold text-foreground">Vehicle</span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="vehicleYear" className="text-[10px]">Year</Label>
              <Input
                id="vehicleYear"
                placeholder="2024"
                value={specs.vehicleYear}
                onChange={(e) => setSpecs({ ...specs, vehicleYear: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vehicleMake" className="text-[10px]">Make</Label>
              <Input
                id="vehicleMake"
                placeholder="Ford"
                value={specs.vehicleMake}
                onChange={(e) => setSpecs({ ...specs, vehicleMake: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vehicleModel" className="text-[10px]">Model</Label>
              <Input
                id="vehicleModel"
                placeholder="Transit"
                value={specs.vehicleModel}
                onChange={(e) => setSpecs({ ...specs, vehicleModel: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Optional Specs Section */}
        <div className="space-y-3 pt-3 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground">Optional Specifications</span>
          
          {/* Wheelbase */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="wheelbase" className="text-[10px]">Wheelbase</Label>
              <Input
                id="wheelbase"
                placeholder='e.g., 130"'
                value={specs.wheelbase}
                onChange={(e) => setSpecs({ ...specs, wheelbase: e.target.value })}
                disabled={specs.wheelbaseIsNa}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-5">
              <Checkbox
                id="wheelbaseNa"
                checked={specs.wheelbaseIsNa}
                onCheckedChange={(checked) => setSpecs({ ...specs, wheelbaseIsNa: !!checked, wheelbase: checked ? "" : specs.wheelbase })}
              />
              <Label htmlFor="wheelbaseNa" className="text-[10px] text-muted-foreground">N/A</Label>
            </div>
          </div>

          {/* Roof Height */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="roofHeight" className="text-[10px]">Roof Height</Label>
              <Input
                id="roofHeight"
                placeholder="e.g., High Roof"
                value={specs.roofHeight}
                onChange={(e) => setSpecs({ ...specs, roofHeight: e.target.value })}
                disabled={specs.roofHeightIsNa}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-5">
              <Checkbox
                id="roofHeightNa"
                checked={specs.roofHeightIsNa}
                onCheckedChange={(checked) => setSpecs({ ...specs, roofHeightIsNa: !!checked, roofHeight: checked ? "" : specs.roofHeight })}
              />
              <Label htmlFor="roofHeightNa" className="text-[10px] text-muted-foreground">N/A</Label>
            </div>
          </div>

          {/* Body Length */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="bodyLength" className="text-[10px]">Body Length</Label>
              <Input
                id="bodyLength"
                placeholder="e.g., Extended"
                value={specs.bodyLength}
                onChange={(e) => setSpecs({ ...specs, bodyLength: e.target.value })}
                disabled={specs.bodyLengthIsNa}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-5">
              <Checkbox
                id="bodyLengthNa"
                checked={specs.bodyLengthIsNa}
                onCheckedChange={(checked) => setSpecs({ ...specs, bodyLengthIsNa: !!checked, bodyLength: checked ? "" : specs.bodyLength })}
              />
              <Label htmlFor="bodyLengthNa" className="text-[10px] text-muted-foreground">N/A</Label>
            </div>
          </div>

          {/* Scale Reference */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="scaleReference" className="text-[10px]">Scale Reference</Label>
              <Input
                id="scaleReference"
                placeholder='e.g., 1" = 12"'
                value={specs.scaleReference}
                onChange={(e) => setSpecs({ ...specs, scaleReference: e.target.value })}
                disabled={specs.scaleReferenceIsNa}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-5">
              <Checkbox
                id="scaleReferenceNa"
                checked={specs.scaleReferenceIsNa}
                onCheckedChange={(checked) => setSpecs({ ...specs, scaleReferenceIsNa: !!checked, scaleReference: checked ? "" : specs.scaleReference })}
              />
              <Label htmlFor="scaleReferenceNa" className="text-[10px] text-muted-foreground">N/A</Label>
            </div>
          </div>

          {/* Panel Count */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="panelCount" className="text-[10px]">Panel Count</Label>
              <Input
                id="panelCount"
                type="number"
                placeholder="e.g., 6"
                value={specs.panelCount || ""}
                onChange={(e) => setSpecs({ ...specs, panelCount: e.target.value ? Number(e.target.value) : null })}
                disabled={specs.panelCountIsNa}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-5">
              <Checkbox
                id="panelCountNa"
                checked={specs.panelCountIsNa}
                onCheckedChange={(checked) => setSpecs({ ...specs, panelCountIsNa: !!checked, panelCount: checked ? null : specs.panelCount })}
              />
              <Label htmlFor="panelCountNa" className="text-[10px] text-muted-foreground">N/A</Label>
            </div>
          </div>
        </div>

        {/* Internal Notes */}
        <div className="space-y-1.5 pt-3 border-t border-border">
          <Label htmlFor="internalNotes" className="text-xs text-muted-foreground">
            Internal Notes (not shown to customer)
          </Label>
          <Textarea
            id="internalNotes"
            placeholder="Any notes for production team..."
            value={specs.internalNotes}
            onChange={(e) => setSpecs({ ...specs, internalNotes: e.target.value })}
            className="h-16 text-xs resize-none"
          />
        </div>

        {/* Validation Status */}
        <div className="pt-3 border-t border-border space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Validation Status</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              {has3DRenders ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={has3DRenders ? "text-green-500" : "text-destructive"}>
                3D renders {has3DRenders ? "exist" : "required"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {specs.totalSqFt && specs.totalSqFt > 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={specs.totalSqFt && specs.totalSqFt > 0 ? "text-green-500" : "text-destructive"}>
                Total SQ FT entered
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {specs.wrapScope ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={specs.wrapScope ? "text-green-500" : "text-destructive"}>
                Wrap scope selected
              </span>
            </div>
          </div>
        </div>

        {/* Generate Proof Button */}
        <div className="pt-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    onClick={handleGenerateProof}
                    disabled={!isValid || isGenerating}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50"
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Proof...
                      </>
                    ) : existingProofVersionId ? (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Regenerate Approval Proof
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Generate Approval Proof
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {!isValid && (
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-xs">Missing requirements:</p>
                    <ul className="text-xs space-y-0.5">
                      {validationErrors.map((error, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Existing Proof Status */}
        {existingProofVersionId && (
          <div className="text-center">
            <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approval proof generated
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
