import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DesignPanel } from '../panel-api';
import { Download, Eye, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PanelCardProps {
  panel: DesignPanel;
  onView: (panel: DesignPanel) => void;
  onDelete: (id: string) => void;
  onDuplicate: (panel: DesignPanel) => void;
}

export function PanelCard({ panel, onView, onDelete, onDuplicate }: PanelCardProps) {
  const downloadTiff = () => {
    if (panel.tiff_url) {
      window.open(panel.tiff_url, '_blank');
    }
  };

  return (
    <Card className="rounded-2xl bg-[#141415] border-border hover:border-[#22d3ee]/50 transition-all cursor-pointer group overflow-hidden">
      <div className="aspect-video relative overflow-hidden" onClick={() => onView(panel)}>
        {panel.panel_preview_url ? (
          <img
            src={panel.panel_preview_url}
            alt={`${panel.vehicle_make} ${panel.vehicle_model} panel`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full bg-black/20 flex items-center justify-center">
            <p className="text-muted-foreground">No preview</p>
          </div>
        )}
        
        {panel.panel_3d_url && (
          <Badge className="absolute top-2 right-2 bg-[#22d3ee] text-black">
            3D Ready
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg">
            {panel.vehicle_make} {panel.vehicle_model}
          </h3>
          <p className="text-sm text-muted-foreground">
            {panel.vehicle_year} • {panel.style}
            {panel.substyle && ` • ${panel.substyle}`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {panel.width_inches}" × {panel.height_inches}"
          </p>
        </div>

        {panel.tags && panel.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {panel.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(panel)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          
          {panel.tiff_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={downloadTiff}
              className="flex-1 bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20"
            >
              <Download className="h-4 w-4 mr-1" />
              TIFF
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDuplicate(panel)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(panel.id)}
            className="hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Created: {new Date(panel.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
