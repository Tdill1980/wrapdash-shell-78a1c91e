import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Video, Image } from "lucide-react";
import { listContentBoxAssets, ContentAsset } from "@/lib/contentBoxQueries";
import { AssetTagEditor } from "./AssetTagEditor";

export function AssetGrid() {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listContentBoxAssets();
      setAssets(data);
    } catch (err) {
      console.error("Failed to load assets:", err);
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleTagsUpdated = (assetId: string, newTags: string[]) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              metadata: {
                ...a.metadata,
                asset_tags: newTags,
              },
            }
          : a
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">{error}</p>
      </Card>
    );
  }

  if (assets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-foreground font-medium">No uploaded assets yet</p>
        <p className="text-muted-foreground text-sm mt-1">
          Upload videos via the media library to see them here
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onTagsUpdated={(newTags) => handleTagsUpdated(asset.id, newTags)}
        />
      ))}
    </div>
  );
}

function AssetCard({
  asset,
  onTagsUpdated,
}: {
  asset: ContentAsset;
  onTagsUpdated: (newTags: string[]) => void;
}) {
  const assetUrl = asset.metadata?.asset_url;
  const assetTags = asset.metadata?.asset_tags ?? [];
  const analysisInfo = asset.metadata?.asset_analysis_meta;
  const isVideo = assetUrl?.match(/\.(mp4|mov|webm|avi)$/i);

  return (
    <Card className="overflow-hidden bg-card border-border">
      {/* Preview */}
      <div className="relative aspect-video bg-muted">
        {assetUrl ? (
          isVideo ? (
            <video
              src={assetUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          ) : (
            <img
              src={assetUrl}
              alt={asset.title || "Asset"}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <Video className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Image className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Type badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-xs"
        >
          {isVideo ? "Video" : "Image"}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium text-foreground truncate">
          {asset.title || "Untitled"}
        </p>

        <p className="text-xs text-muted-foreground">
          {new Date(asset.created_at).toLocaleDateString()}
        </p>

        {/* AI Analysis Info */}
        {analysisInfo && (
          <p className="text-xs text-primary">
            AI analyzed ({analysisInfo.accepted_count ?? 0} tags)
          </p>
        )}

        {/* Tag Editor */}
        <AssetTagEditor
          assetId={asset.id}
          tags={assetTags}
          onTagsUpdated={onTagsUpdated}
        />
      </div>
    </Card>
  );
}
