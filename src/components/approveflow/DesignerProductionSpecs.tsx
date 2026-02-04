// ============================================
// ApproveFlow OS — Designer Production Specs Panel (Zone 4)
// ============================================
// LAYOUT ORDER (TOP TO BOTTOM):
// 1. Validation Status
// 2. Vehicle for 3D Render (with auto-detect checkbox)
// 3. Upload 2D Proof
// 4. Actions (Generate 3D, Generate Proof, Email)
// 5. Production Specifications (SQ FT, Wrap Scope)
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
  Mail,
  Car
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
  autoDetectVehicle: boolean;
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
  onUpload?: (file: File, notes: string) => Promise<void>;
  onGenerate3D?: (autoDetect: boolean) => Promise<void>;
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
  // Auto-detect checkbox state - DEFAULT ON
  const [autoDetectVehicle, setAutoDetectVehicle] = useState(true);

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
    autoDetectVehicle: true,
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
      // If vehicle info is provided, turn off auto-detect
      if (vehicleInfo.year && vehicleInfo.make && vehicleInfo.model) {
        setAutoDetectVehicle(false);
      }
    }
  }, [vehicleInfo]);

  // Validation
  const validationItems = [
    { label: "3D renders", met: has3DRenders, required: true },
    { label: "Total SQ FT", met: specs.totalSqFt !== null && specs.totalSqFt > 0, required: true },
    { label: "Wrap scope", met: !!specs.wrapScope, required: true },
  ];

  const metCount = validationItems.filter(v => v.met).length;
  const totalRequired = validationItems.length;
  const isValid = validationItems.every(v => v.met);

  const handleGenerateProof = async () => {
    if (!isValid) return;
    await onGenerateProof({ ...specs, autoDetectVehicle });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    await onUpload(file, uploadNotes);
    setUploadNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate3D = () => {
    if (onGenerate3D) {
      onGenerate3D(autoDetectVehicle);
    }
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
        {/* 1. VALIDATION STATUS */}
        {/* ============================================ */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Validation Status
            </span>
            <Badge
              variant={isValid ? "default" : "outline"}
              className={`text-[10px] ${isValid ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'border-indigo-500/50 text-indigo-300'}`}
            >
              {metCount} of {totalRequired} requirements met
            </Badge>
          </div>
          <div className="space-y-1.5">
            {validationItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {item.met ? (
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-indigo-400" />
                  </div>
                )}
                <span className={item.met ? "text-cyan-400" : "text-indigo-300"}>
                  {item.label} {item.met ? "✓" : "required"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* 2. VEHICLE FOR 3D RENDER — ABOVE UPLOAD */}
        {/* ============================================ */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
            <Car className="w-3.5 h-3.5" />
            Vehicle for 3D Render
          </h4>

          {/* Auto-detect checkbox */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-colors">
            <Checkbox
              checked={autoDetectVehicle}
              onCheckedChange={(checked) => setAutoDetectVehicle(!!checked)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <span className="text-sm text-white font-medium flex items-center gap-2">
                <span>🔍</span>
                Auto-detect vehicle from my 2D proof
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                AI will identify the vehicle type automatically when generating 3D renders
              </p>
            </div>
          </label>

          {/* Manual entry fields - disabled when auto-detect is on */}
          <div className={`space-y-3 transition-opacity ${autoDetectVehicle ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <p className="text-xs text-muted-foreground border-b border-border/50 pb-2">
              — OR enter vehicle manually —
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Year</Label>
                <Input
                  placeholder="2024"
                  value={specs.vehicleYear}
                  onChange={(e) => setSpecs({ ...specs, vehicleYear: e.target.value })}
                  disabled={autoDetectVehicle}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Make</Label>
                <Input
                  placeholder="Ford"
                  value={specs.vehicleMake}
                  onChange={(e) => setSpecs({ ...specs, vehicleMake: e.target.value })}
                  disabled={autoDetectVehicle}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Model</Label>
                <Input
                  placeholder="Transit"
                  value={specs.vehicleModel}
                  onChange={(e) => setSpecs({ ...specs, vehicleModel: e.target.value })}
                  disabled={autoDetectVehicle}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Optional vehicle specs */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Optional</span>

              {/* Wheelbase */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder='Wheelbase (e.g., 130")'
                    value={specs.wheelbase}
                    onChange={(e) => setSpecs({ ...specs, wheelbase: e.target.value })}
                    disabled={autoDetectVehicle || specs.wheelbaseIsNa}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="wheelbaseNa"
                    checked={specs.wheelbaseIsNa}
                    disabled={autoDetectVehicle}
                    onCheckedChange={(checked) => setSpecs({ ...specs, wheelbaseIsNa: !!checked, wheelbase: checked ? "" : specs.wheelbase })}
                  />
                  <Label htmlFor="wheelbaseNa" className="text-[10px] text-muted-foreground">N/A</Label>
                </div>
              </div>

              {/* Roof Height */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Roof Height (e.g., High Roof)"
                    value={specs.roofHeight}
                    onChange={(e) => setSpecs({ ...specs, roofHeight: e.target.value })}
                    disabled={autoDetectVehicle || specs.roofHeightIsNa}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="roofHeightNa"
                    checked={specs.roofHeightIsNa}
                    disabled={autoDetectVehicle}
                    onCheckedChange={(checked) => setSpecs({ ...specs, roofHeightIsNa: !!checked, roofHeight: checked ? "" : specs.roofHeight })}
                  />
                  <Label htmlFor="roofHeightNa" className="text-[10px] text-muted-foreground">N/A</Label>
                </div>
              </div>

              {/* Body Length */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Body Length (e.g., Extended)"
                    value={specs.bodyLength}
                    onChange={(e) => setSpecs({ ...specs, bodyLength: e.target.value })}
                    disabled={autoDetectVehicle || specs.bodyLengthIsNa}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="bodyLengthNa"
                    checked={specs.bodyLengthIsNa}
                    disabled={autoDetectVehicle}
                    onCheckedChange={(checked) => setSpecs({ ...specs, bodyLengthIsNa: !!checked, bodyLength: checked ? "" : specs.bodyLength })}
                  />
                  <Label htmlFor="bodyLengthNa" className="text-[10px] text-muted-foreground">N/A</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 3. UPLOAD 2D PROOF — AFTER VEHICLE */}
        {/* ============================================ */}
        {onUpload && (
          <div className="pt-4 border-t border-border space-y-3">
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
          </div>
        )}

        {/* ============================================ */}
        {/* 4. ACTIONS */}
        {/* ============================================ */}
        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Actions</h4>

          {/* Generate 3D Render */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    onClick={handleGenerate3D}
                    disabled={!hasVersions || isGenerating3D || !onGenerate3D}
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {isGenerating3D ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {autoDetectVehicle ? "Detecting & Generating..." : "Generating 3D..."}
                      </>
                    ) : (
                      <>
                        <Box className="w-3 h-3" />
                        Generate 3D Render
                        {autoDetectVehicle && <Badge className="ml-1 text-[9px] bg-purple-500/20 text-purple-300">Auto-detect</Badge>}
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {!hasVersions && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Upload a 2D proof first to enable 3D generation</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Generate Approval Proof Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    onClick={handleGenerateProof}
                    disabled={!isValid || isGenerating}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:opacity-90 disabled:opacity-50"
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

          {/* Existing Proof Status */}
          {existingProofVersionId && (
            <div className="text-center">
              <Badge variant="outline" className="text-[10px] border-cyan-500/50 text-cyan-400">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Approval proof generated
              </Badge>
            </div>
          )}

          {/* Email Proof to Customer */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-primary/50 hover:bg-primary/10"
                    onClick={onEmailProof}
                    disabled={!existingProofVersionId || !onEmailProof}
                  >
                    <Mail className="w-3 h-3" />
                    Email Proof to Customer
                  </Button>
                </div>
              </TooltipTrigger>
              {!existingProofVersionId && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Generate an approval proof first to enable email</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* ============================================ */}
        {/* 5. PRODUCTION SPECIFICATIONS */}
        {/* ============================================ */}
        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Production Specifications</h4>

          <div className="space-y-3">
            {/* Total SQ FT */}
            <div className="space-y-1.5">
              <Label htmlFor="totalSqFt" className="text-xs">
                Total SQ FT <span className="text-indigo-400">*</span>
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
                Wrap Scope <span className="text-indigo-400">*</span>
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

            {/* Internal Notes */}
            <div className="space-y-1.5 pt-2">
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
        </div>
      </CardContent>
    </Card>
  );
}
