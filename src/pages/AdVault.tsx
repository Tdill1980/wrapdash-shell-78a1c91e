// src/pages/AdVault.tsx

import React, { useState } from "react";
import { useAdVault } from "@/hooks/useAdVault";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Trash2,
  Copy,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  LayoutTemplate,
  Filter,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogPerformanceModal } from "@/components/ads/LogPerformanceModal";

export default function AdVault() {
  const { organizationId } = useOrganization();
  const { ads, isLoading, removeFromVault, isDeleting } = useAdVault(
    organizationId || undefined
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPlacement, setFilterPlacement] = useState<string>("all");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedAdForLog, setSelectedAdForLog] = useState<{
    id: string;
    imageUrl: string;
    headline: string | null;
  } | null>(null);

  const filteredAds = ads.filter((ad) => {
    if (filterType !== "all" && ad.type !== filterType) return false;
    if (filterPlacement !== "all" && ad.placement !== filterPlacement) return false;
    return true;
  });

  const placements = [...new Set(ads.map((a) => a.placement))];

  const handleDownload = async (url: string, headline?: string | null) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${headline || "ad"}-${Date.now()}.png`;
      link.click();
      toast.success("Download started");
    } catch {
      toast.error("Failed to download");
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ad Vault</h1>
          <p className="text-muted-foreground mt-1">
            Your saved static ad creatives
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="template">Template</SelectItem>
              <SelectItem value="ai">AI Designed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPlacement} onValueChange={setFilterPlacement}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Placements</SelectItem>
              {placements.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      ) : filteredAds.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Ads Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Generate static ads from the ContentBox Paid Ads flow and save
              them here for quick reuse.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAds.map((ad) => (
            <Card
              key={ad.id}
              className="group overflow-hidden border-2 hover:border-primary/50 transition-all"
            >
              <div className="relative aspect-[4/5] bg-muted">
                <img
                  src={ad.png_url}
                  alt={ad.headline || "Ad"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleDownload(ad.png_url, ad.headline)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleCopyUrl(ad.png_url)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeFromVault(ad.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                    onClick={() => {
                      setSelectedAdForLog({
                        id: ad.id,
                        imageUrl: ad.png_url,
                        headline: ad.headline,
                      });
                      setLogModalOpen(true);
                    }}
                    title="Log Performance"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge
                    variant="secondary"
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    {ad.type === "template" ? (
                      <LayoutTemplate className="w-3 h-3 mr-1" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    {ad.type}
                  </Badge>
                </div>

                <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground">
                  {ad.placement}
                </Badge>
              </div>

              <CardContent className="p-3 space-y-1">
                <p className="font-medium text-sm truncate">
                  {ad.headline || "Untitled Ad"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {ad.cta || "No CTA"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(ad.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LogPerformanceModal
        open={logModalOpen}
        onClose={() => {
          setLogModalOpen(false);
          setSelectedAdForLog(null);
        }}
        adVaultId={selectedAdForLog?.id}
        adType="static"
        adPreview={{
          imageUrl: selectedAdForLog?.imageUrl,
          headline: selectedAdForLog?.headline || undefined,
        }}
      />
    </div>
  );
}
