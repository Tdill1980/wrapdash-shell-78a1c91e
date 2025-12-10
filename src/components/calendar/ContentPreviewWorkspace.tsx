import { useState } from "react";
import { ContentQueueItem } from "@/hooks/usePlanner";
import { getPreviewPreset, getScaledDimensions, PLATFORM_OPTIONS } from "@/lib/platformPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Copy, 
  Calendar, 
  Edit, 
  Trash2,
  X,
  Smartphone,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContentPreviewWorkspaceProps {
  item: ContentQueueItem;
  onClose: () => void;
}

export function ContentPreviewWorkspace({ item, onClose }: ContentPreviewWorkspaceProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(item.platform || "instagram");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showDevice, setShowDevice] = useState(true);

  const preset = getPreviewPreset(selectedPlatform, item.content_type || "static");
  const scaled = getScaledDimensions(preset, 500);

  const mediaUrl = item.output_url || item.media_urls?.[0];
  const isVideo = item.content_type === "reel" || item.content_type === "video" || 
                  mediaUrl?.includes(".mp4") || mediaUrl?.includes(".mov");

  const copyCaption = () => {
    if (item.caption) {
      navigator.clipboard.writeText(item.caption);
      toast.success("Caption copied!");
    }
  };

  const copyHashtags = () => {
    if (item.hashtags?.length) {
      navigator.clipboard.writeText(item.hashtags.map(h => `#${h}`).join(" "));
      toast.success("Hashtags copied!");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-semibold">
              {item.title || "Content Preview"}
            </DialogTitle>
            <Badge variant="outline" className="capitalize">
              {item.content_type || "content"}
            </Badge>
            <Badge 
              className={cn(
                "capitalize",
                item.status === "scheduled" && "bg-blue-500",
                item.status === "approved" && "bg-green-500",
                item.status === "deployed" && "bg-purple-500",
                item.status === "draft" && "bg-amber-500"
              )}
            >
              {item.status || "draft"}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Preview Panel */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-muted/30 to-muted/10 overflow-auto">
            {/* Platform Selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {PLATFORM_OPTIONS.map((platform) => (
                <Button
                  key={platform.value}
                  variant={selectedPlatform === platform.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform.value)}
                  className={cn(
                    "transition-all",
                    selectedPlatform === platform.value && 
                    "bg-gradient-to-r from-[#405DE6] to-[#E1306C] border-0"
                  )}
                >
                  <span className="mr-1.5">{platform.icon}</span>
                  {platform.label}
                </Button>
              ))}
            </div>

            {/* Device Frame Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDevice(!showDevice)}
              >
                {showDevice ? <Smartphone className="h-4 w-4 mr-1" /> : <Monitor className="h-4 w-4 mr-1" />}
                {showDevice ? "Device Frame" : "Raw Preview"}
              </Button>
            </div>

            {/* Preview Container */}
            <div 
              className={cn(
                "relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                showDevice && "bg-black p-2 rounded-[2rem]"
              )}
              style={{
                width: scaled.width,
                maxWidth: "100%",
              }}
            >
              {/* Device Notch (for vertical formats) */}
              {showDevice && preset.height > preset.width && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />
              )}

              {/* Media Content */}
              <div 
                className="relative bg-muted overflow-hidden"
                style={{
                  aspectRatio: `${preset.width} / ${preset.height}`,
                  borderRadius: showDevice ? "1.5rem" : "0.5rem",
                }}
              >
                {mediaUrl ? (
                  isVideo ? (
                    <video
                      src={mediaUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay={isPlaying}
                      loop
                      muted={isMuted}
                      playsInline
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}

                {/* Caption Overlay (Instagram-style) */}
                {item.caption && selectedPlatform === "instagram" && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm line-clamp-2">
                      {item.caption}
                    </p>
                  </div>
                )}

                {/* Video Controls */}
                {isVideo && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/50 hover:bg-black/70"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/50 hover:bg-black/70"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Platform Info Bar */}
              <div className="mt-2 text-center text-xs text-muted-foreground">
                {preset.label} • {preset.width}×{preset.height} • {preset.aspectRatio}
              </div>
            </div>
          </div>

          {/* Right: Details Panel */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l p-6 overflow-auto space-y-6 bg-card/50">
            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Caption</label>
                <Button variant="ghost" size="sm" onClick={copyCaption}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={item.caption || ""}
                readOnly
                className="min-h-[100px] bg-muted/50"
              />
            </div>

            {/* Hashtags */}
            {item.hashtags && item.hashtags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Hashtags</label>
                  <Button variant="ghost" size="sm" onClick={copyHashtags}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.hashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {item.cta_text && (
              <div>
                <label className="text-sm font-medium mb-2 block">Call to Action</label>
                <Badge variant="outline" className="text-sm">
                  {item.cta_text}
                </Badge>
              </div>
            )}

            {/* Content Type & Mode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Type</label>
                <p className="text-sm capitalize">{item.content_type || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Mode</label>
                <p className="text-sm capitalize">{item.mode || "—"}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t space-y-2">
              <Button className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Post
              </Button>
              
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                {mediaUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={mediaUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
