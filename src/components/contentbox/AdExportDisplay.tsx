import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileJson, FileSpreadsheet, CheckCircle, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MetaAdCreative, exportAsCSV, exportAsJSON } from "@/lib/ads-transformer";

interface AdExportDisplayProps {
  adCreative: MetaAdCreative | null;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
}

export function AdExportDisplay({
  adCreative,
  onExportJSON,
  onExportCSV,
}: AdExportDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!adCreative) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(adCreative, null, 2));
    setCopied(true);
    toast.success("Ad creative copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(adCreative, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-creative-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded!");
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      "Primary Text,Headline,Description,CTA,Video URL,Hashtags",
      `"${adCreative.primary_text.replace(/"/g, '""')}","${adCreative.headline}","${adCreative.description}","${adCreative.cta_button}","${adCreative.video_url || ""}","${adCreative.hashtags.join(" ")}"`,
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-creative-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  return (
    <Card className="border-orange-500/30 bg-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-orange-500" />
            Meta Ad Package Ready
          </CardTitle>
          <Badge className="bg-orange-500">{adCreative.ad_objective}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ad Preview Fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Headline</span>
            <p className="text-sm font-semibold bg-background/50 p-2 rounded border border-border/50">
              {adCreative.headline}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Primary Text</span>
            <p className="text-xs bg-background/50 p-2 rounded border border-border/50 max-h-20 overflow-y-auto">
              {adCreative.primary_text}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <p className="text-xs bg-background/50 p-2 rounded border border-border/50">
              {adCreative.description}
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline">{adCreative.creative_type}</Badge>
            <Badge className="bg-primary">{adCreative.cta_button.replace(/_/g, " ")}</Badge>
          </div>
        </div>

        {/* Hashtags */}
        {adCreative.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {adCreative.hashtags.slice(0, 5).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </Badge>
            ))}
            {adCreative.hashtags.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{adCreative.hashtags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Raw JSON Preview */}
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            View Raw JSON
          </summary>
          <pre className="text-xs bg-muted/50 p-2 rounded mt-2 max-h-32 overflow-auto">
            {JSON.stringify(adCreative, null, 2)}
          </pre>
        </details>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <Button size="sm" variant="outline" onClick={handleCopyJSON}>
            {copied ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            Copy JSON
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadJSON}>
            <FileJson className="w-3 h-3 mr-1" />
            Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadCSV}>
            <FileSpreadsheet className="w-3 h-3 mr-1" />
            Export CSV
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Use these exports to upload directly to Meta Ads Manager or for bulk ad creation.
        </p>
      </CardContent>
    </Card>
  );
}
