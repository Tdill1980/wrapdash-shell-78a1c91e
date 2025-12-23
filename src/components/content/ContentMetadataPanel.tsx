import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Megaphone, 
  Sprout, 
  DollarSign,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  AtSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContentMetadata {
  brand: string;
  channel: string;
  contentPurpose: "organic" | "paid";
  platform: string;
  adPlacement?: string;
  contentType?: string;
}

interface ContentMetadataPanelProps {
  metadata: ContentMetadata;
  onChange: (metadata: ContentMetadata) => void;
  compact?: boolean;
  showContentType?: boolean;
}

const BRANDS = [
  { value: "wpw", label: "WePrintWraps", color: "bg-blue-500" },
  { value: "wraptvworld", label: "WrapTV World", color: "bg-purple-500" },
  { value: "wraptv", label: "WrapTV", color: "bg-red-500" },
  { value: "inkandedge", label: "Ink & Edge", color: "bg-amber-500" },
  { value: "wrapcommand", label: "WrapCommand AI", color: "bg-green-500" },
  { value: "custom", label: "Custom Brand", color: "bg-gray-500" },
];

const CHANNELS = {
  wpw: [
    { value: "@weprintwraps", label: "@weprintwraps" },
    { value: "@weprintvrapsofficial", label: "@weprintwrapsofficial" },
  ],
  wraptvworld: [
    { value: "@wraptvworld", label: "@wraptvworld" },
  ],
  wraptv: [
    { value: "@wraptv", label: "@wraptv" },
  ],
  inkandedge: [
    { value: "@inkandedge", label: "@inkandedge" },
  ],
  wrapcommand: [
    { value: "@wrapcommand", label: "@wrapcommand" },
  ],
  custom: [
    { value: "custom", label: "Custom Channel" },
  ],
};

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "tiktok", label: "TikTok", icon: AtSign },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
];

const AD_PLACEMENTS = [
  { value: "feed", label: "Feed" },
  { value: "stories", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "explore", label: "Explore" },
  { value: "search", label: "Search" },
  { value: "audience_network", label: "Audience Network" },
];

const CONTENT_TYPES = [
  { value: "reel", label: "Reel" },
  { value: "static", label: "Static Post" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "magazine", label: "Magazine" },
  { value: "article", label: "Article" },
  { value: "ad", label: "Ad Creative" },
];

export function ContentMetadataPanel({
  metadata,
  onChange,
  compact = false,
  showContentType = false,
}: ContentMetadataPanelProps) {
  const availableChannels = CHANNELS[metadata.brand as keyof typeof CHANNELS] || CHANNELS.custom;
  const selectedBrand = BRANDS.find((b) => b.value === metadata.brand);

  const handleChange = <K extends keyof ContentMetadata>(
    key: K,
    value: ContentMetadata[K]
  ) => {
    const updated = { ...metadata, [key]: value };
    
    // Reset channel when brand changes
    if (key === "brand") {
      const newChannels = CHANNELS[value as keyof typeof CHANNELS] || CHANNELS.custom;
      updated.channel = newChannels[0]?.value || "";
    }
    
    // Clear ad placement when switching to organic
    if (key === "contentPurpose" && value === "organic") {
      updated.adPlacement = undefined;
    }
    
    onChange(updated);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
        {/* Brand Badge */}
        <Badge className={cn("flex items-center gap-1", selectedBrand?.color)}>
          <Building2 className="w-3 h-3" />
          {selectedBrand?.label || metadata.brand}
        </Badge>

        {/* Organic/Paid Toggle */}
        <Badge
          variant={metadata.contentPurpose === "paid" ? "default" : "secondary"}
          className={cn(
            "cursor-pointer transition-colors",
            metadata.contentPurpose === "paid"
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          )}
          onClick={() =>
            handleChange(
              "contentPurpose",
              metadata.contentPurpose === "organic" ? "paid" : "organic"
            )
          }
        >
          {metadata.contentPurpose === "paid" ? (
            <>
              <DollarSign className="w-3 h-3 mr-1" />
              PAID
            </>
          ) : (
            <>
              <Sprout className="w-3 h-3 mr-1" />
              ORGANIC
            </>
          )}
        </Badge>

        {/* Platform */}
        <Badge variant="outline" className="flex items-center gap-1">
          {(() => {
            const p = PLATFORMS.find((p) => p.value === metadata.platform);
            const Icon = p?.icon || AtSign;
            return (
              <>
                <Icon className="w-3 h-3" />
                {p?.label || metadata.platform}
              </>
            );
          })()}
        </Badge>

        {/* Ad Placement (if paid) */}
        {metadata.contentPurpose === "paid" && metadata.adPlacement && (
          <Badge variant="outline" className="text-amber-400 border-amber-500/30">
            <Megaphone className="w-3 h-3 mr-1" />
            {metadata.adPlacement}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-card/50 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Content Metadata
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Brand */}
        <div className="space-y-2">
          <Label className="text-xs">Brand</Label>
          <Select
            value={metadata.brand}
            onValueChange={(v) => handleChange("brand", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", b.color)} />
                    {b.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Channel */}
        <div className="space-y-2">
          <Label className="text-xs">Channel</Label>
          {metadata.brand === "custom" ? (
            <Input
              placeholder="@handle"
              value={metadata.channel}
              onChange={(e) => handleChange("channel", e.target.value)}
              className="h-9"
            />
          ) : (
            <Select
              value={metadata.channel}
              onValueChange={(v) => handleChange("channel", v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {availableChannels.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Organic/Paid Toggle */}
      <div className="space-y-2">
        <Label className="text-xs">Content Purpose</Label>
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border">
          <button
            type="button"
            onClick={() => handleChange("contentPurpose", "organic")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              metadata.contentPurpose === "organic"
                ? "bg-green-500/20 text-green-400 border border-green-500/40"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Sprout className="w-4 h-4" />
            Organic
          </button>
          <button
            type="button"
            onClick={() => handleChange("contentPurpose", "paid")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              metadata.contentPurpose === "paid"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <DollarSign className="w-4 h-4" />
            Paid Ad
          </button>
        </div>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <Label className="text-xs">Platform</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleChange("platform", p.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  metadata.platform === p.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Type (optional) */}
      {showContentType && (
        <div className="space-y-2">
          <Label className="text-xs">Content Type</Label>
          <Select
            value={metadata.contentType || "reel"}
            onValueChange={(v) => handleChange("contentType", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>
                  {ct.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Ad Placement (shown when Paid is selected) */}
      {metadata.contentPurpose === "paid" && (
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-2">
            <Megaphone className="w-3 h-3 text-amber-400" />
            Ad Placement
          </Label>
          <div className="flex flex-wrap gap-2">
            {AD_PLACEMENTS.map((placement) => (
              <button
                key={placement.value}
                type="button"
                onClick={() => handleChange("adPlacement", placement.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  metadata.adPlacement === placement.value
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {placement.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export hook for default metadata
export function useContentMetadata(initialBrand: string = "wpw"): [ContentMetadata, React.Dispatch<React.SetStateAction<ContentMetadata>>] {
  const [metadata, setMetadata] = React.useState<ContentMetadata>({
    brand: initialBrand,
    channel: CHANNELS[initialBrand as keyof typeof CHANNELS]?.[0]?.value || "",
    contentPurpose: "organic",
    platform: "instagram",
    contentType: "reel",
  });

  return [metadata, setMetadata];
}
