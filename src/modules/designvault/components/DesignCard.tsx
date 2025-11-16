import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DesignVisualization } from "../hooks/useDesignVault";
import { Calendar } from "lucide-react";

interface DesignCardProps {
  design: DesignVisualization;
  onClick: () => void;
}

export const DesignCard = ({ design, onClick }: DesignCardProps) => {
  const renderUrls = design.render_urls as { hero?: string } | null;
  const heroImage = renderUrls?.hero || "/placeholder.svg";

  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-card border-border hover:shadow-card-hover transition-all duration-300"
      onClick={onClick}
    >
      <div className="aspect-video w-full overflow-hidden bg-black/50 relative">
        <img
          src={heroImage}
          alt={`${design.vehicle_make} ${design.vehicle_model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base text-foreground">
            {design.vehicle_year} {design.vehicle_make} {design.vehicle_model}
          </h3>
          <p className="text-xs text-muted-foreground capitalize">
            {design.vehicle_type}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {design.color_hex && (
            <div
              className="w-5 h-5 rounded-full border border-border"
              style={{ backgroundColor: design.color_hex }}
            />
          )}
          <span className="text-xs font-medium text-foreground">
            {design.color_name || design.color_hex}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {new Date(design.created_at).toLocaleDateString()}
        </div>

        {design.tags && design.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {design.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs py-0.5 px-2">
                {tag}
              </Badge>
            ))}
            {design.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs py-0.5 px-2">
                +{design.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
