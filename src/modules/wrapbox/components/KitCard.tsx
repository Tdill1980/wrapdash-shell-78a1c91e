import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WrapBoxKit } from "../hooks/useWrapBoxKits";
import { Package, FileText, Download } from "lucide-react";

interface KitCardProps {
  kit: WrapBoxKit;
  onClick: () => void;
}

export const KitCard = ({ kit, onClick }: KitCardProps) => {
  const panelCount = kit.panels?.length || 0;
  const statusColors = {
    Draft: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    Ready: "bg-green-500/20 text-green-500 border-green-500/30",
    Exported: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
      onClick={onClick}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-purple rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {kit.vehicle_json.year} {kit.vehicle_json.make}{" "}
                {kit.vehicle_json.model}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">
                {kit.vehicle_json.type}
              </p>
            </div>
          </div>
          <Badge className={statusColors[kit.status]}>{kit.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Panels:</span>
            <span className="font-medium">{panelCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium">{kit.status}</span>
          </div>
        </div>

        {kit.tags && kit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {kit.tags.slice(0, 4).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {kit.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{kit.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Created {new Date(kit.created_at).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
};
