// ============================================
// ApproveFlow OS — Designer Production Specs Panel (Zone 4)
// ============================================
// OS ARCHITECTURE — ACTION + VALIDATION PANEL
//
// OS RULES:
// 1. Validation status appears FIRST (top of card)
// 2. Colored indicators: 🟢 green = met, 🔴 red = missing
// 3. "Generate Approval Proof" button state is DERIVED from validation
// 4. Required fields: Total SQ FT, Wrap Scope, 3D Renders
// 5. Optional fields have N/A toggles
// 6. Upload 2D Proof section included in this panel
// ============================================

import { useState, useEffect, useRef } from "react";
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
  Rocket,
  Upload,
  Image as ImageIcon,
  Box,
  Mail
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
  // Upload 2D handlers
  onUpload?: (file: File, notes: string) => Promise<void>;
  onGenerate3D?: () => Promise<void>;
  onEmailProof?: () => Promise<void>;
  isUploading?: boolean;
  isGenerating3D?: boolean;
  hasVersions?: boolean;
}

export function DesignerProductionSpecs({
  projectId,
  orderNumber,
  vehicleInfo,
  has3DRenders,
  existingProofVersionId,
  onGenerateProof,
  isGenerating,
  onUpload,
  onGenerate3D,
  onEmailProof,
  isUploading = false,
  isGenerating3D = false,
  hasVersions = false,
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

  const [uploadNotes, setUploadNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const validationItems = [
    { 
      label: "3D renders", 
      met: has3DRenders,
      required: true 
    },
    { 
      label: "Total SQ FT", 
      met: specs.totalSqFt !== null && specs.totalSqFt > 0,
      required: true 
    },
    { 
      label: "Wrap scope", 
      met: !!specs.wrapScope,
      required: true 
    },
  ];

  const metCount = validationItems.filter(v => v.met).length;
  const totalRequired = validationItems.length;
  const isValid = validationItems.every(v => v.met);

  const handleGenerateProof = async () => {
    if (!isValid) return;
    await onGenerateProof(specs);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    await onUpload(file, uploadNotes);
    setUploadNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Actions & Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ============================================ */}
        {/* VALIDATION STATUS — OS RULE: ALWAYS FIRST */}
        {/* ============================================ */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Validation Status
            </span>
            <Badge 
              variant={isValid ? "default" : "outline"} 
              className={`text-[10px] ${isValid ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'border-amber-500/50 text-amber-400'}`}
            >
              {metCount} of {totalRequired} requirements met
            </Badge>
          </div>
          <div className="space-y-1.5">
            {validationItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {item.met ? (
                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-red-500" />
                  </div>
                )}
                <span className={item.met ? "text-green-400" : "text-red-400"}>
                  {item.label} {item.met ? "✓" : "required"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Proof Button — IMMEDIATELY AFTER VALIDATION */}
        <div>
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
                      {validationItems.filter(v => !v.met).map((item, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {item.label}
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

        {/* ============================================ */}
        {/* UPLOAD 2D PROOF SECTION */}
        {/* ============================================ */}
        {onUpload && (
          <div className="pt-3 border-t border-border space-y-3">
            <h4 className="text-xs font-semibold flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              Upload 2D Proof
            </h4>
            <Textarea
              placeholder="Version notes (optional)"
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              className="text-xs h-14 resize-none"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
              size="sm"
              variant="outline"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="w-3 h-3 mr-2" />
                  Select File
                </>
              )}
            </Button>
            
            {hasVersions && onGenerate3D && (
              <Button
                onClick={onGenerate3D}
                disabled={isGenerating3D}
                size="sm"
                variant="outline"
                className="w-full gap-2"
              >
                {isGenerating3D ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating 3D...
                  </>
                ) : (
                  <>
                    <Box className="w-3 h-3" />
                    Generate 3D Render
                  </>
                )}
              </Button>
            )}

            {hasVersions && onEmailProof && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 border-primary/50 hover:bg-primary/10"
                onClick={onEmailProof}
              >
                <Mail className="w-3 h-3" />
                Email Proof to Customer
              </Button>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* PRODUCTION SPECS FORM */}
        {/* ============================================ */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-xs font-semibold mb-3">Production Specifications</h4>
          
          {/* Required Fields Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Required</span>
              <Badge variant="outline" className="text-[9px] border-destructive/50 text-destructive">
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
          <div className="space-y-3 pt-3 mt-3 border-t border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Vehicle</span>
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
          <div className="space-y-3 pt-3 mt-3 border-t border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Optional Specifications</span>
            
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
          <div className="space-y-1.5 pt-3 mt-3 border-t border-border">
            <Label htmlFor="internalNotes" className="text-xs text-muted-foreground">
              Internal Notes (not shown to customer)
            </Label>
            <Textarea
              id="internalNotes"
              placeholder="Any notes for production team..."
              value={specs.internalNotes}
              onChange={(e) => setSpecs({ ...specs, internalNotes: e.target.value })}
              className="h-14 text-xs resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
