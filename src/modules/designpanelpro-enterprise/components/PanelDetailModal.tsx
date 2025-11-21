import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DesignPanel, fetchVersions, DesignPanelVersion } from '../panel-api';
import { Download, ExternalLink, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PanelDetailModalProps {
  panel: DesignPanel;
  onClose: () => void;
  onUpdate: () => void;
}

export function PanelDetailModal({ panel, onClose, onUpdate }: PanelDetailModalProps) {
  const [versions, setVersions] = useState<DesignPanelVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [panel.id]);

  const loadVersions = async () => {
    try {
      setLoadingVersions(true);
      const data = await fetchVersions(panel.id);
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#141415]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {panel.vehicle_make} {panel.vehicle_model} {panel.vehicle_year}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">2D Panel Design</h3>
              <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black/20">
                <img
                  src={panel.panel_preview_url}
                  alt="Panel preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {panel.panel_3d_url && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">3D Render</h3>
                <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black/20">
                  <img
                    src={panel.panel_3d_url}
                    alt="3D render"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Style:</span> {panel.style}</p>
                {panel.substyle && <p><span className="text-muted-foreground">Sub-style:</span> {panel.substyle}</p>}
                {panel.intensity && <p><span className="text-muted-foreground">Intensity:</span> {panel.intensity}</p>}
                <p><span className="text-muted-foreground">Dimensions:</span> {panel.width_inches}" × {panel.height_inches}"</p>
                <p><span className="text-muted-foreground">Created:</span> {new Date(panel.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {panel.tags && panel.tags.length > 0 ? (
                  panel.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tags</p>
                )}
              </div>
            </div>
          </div>

          {/* Download Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => downloadFile(panel.panel_preview_url, `panel-2d-${panel.id}.png`)}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download 2D
            </Button>

            {panel.panel_3d_url && (
              <Button
                onClick={() => downloadFile(panel.panel_3d_url!, `panel-3d-${panel.id}.png`)}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download 3D
              </Button>
            )}

            {panel.tiff_url && (
              <Button
                onClick={() => window.open(panel.tiff_url, '_blank')}
                className="flex-1 bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Print TIFF
              </Button>
            )}
          </div>

          {/* Version History */}
          {versions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                Version History ({versions.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-3 rounded-lg bg-black/20 border border-border text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Version {version.version_number}</span>
                      <span className="text-muted-foreground">
                        {new Date(version.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {version.changes_description && (
                      <p className="text-muted-foreground mt-1">{version.changes_description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {panel.metadata && Object.keys(panel.metadata).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Print Metadata</h3>
              <pre className="text-xs bg-black/40 p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(panel.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
