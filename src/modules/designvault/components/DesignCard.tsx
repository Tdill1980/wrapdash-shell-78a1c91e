import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DesignVisualization } from "../hooks/useDesignVault";
import { Eye, Save, Image } from "lucide-react";

interface DesignCardProps {
  design: DesignVisualization;
  onClick: () => void;
}

export const DesignCard = ({ design, onClick }: DesignCardProps) => {
  const renderUrls = design.render_urls as { hero?: string } | null;
  const heroImage = renderUrls?.hero || "/placeholder.svg";

  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-[#121218] border-white/5 rounded-lg hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300 flex flex-col h-[420px]"
      onClick={onClick}
    >
      {/* Hero Render - Fixed height for consistency */}
      <div className="relative w-full h-[270px] flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-neutral-200">
          <img
            src={heroImage}
            alt={`${design.vehicle_make} ${design.vehicle_model}`}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }}
          />
        </div>
        
        {/* Status Chips - Top Right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {design.tags && design.tags.includes('premium') && (
            <Badge className="bg-purple-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              Premium
            </Badge>
          )}
          {design.tags && design.tags.includes('new') && (
            <Badge className="bg-blue-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              New
            </Badge>
          )}
          {design.tags && design.tags.includes('exclusive') && (
            <Badge className="bg-pink-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              Exclusive
            </Badge>
          )}
        </div>

        {/* Label Badge - Lower Left */}
        <div className="absolute bottom-2 left-2">
          <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-medium uppercase">
            {design.vehicle_type}
          </div>
        </div>
      </div>

      {/* Title Block + Actions */}
      <div className="p-3 flex flex-col flex-grow">
        <div className="mb-3 flex-grow">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {design.vehicle_year} {design.vehicle_make} {design.vehicle_model}
          </h3>
          <p className="text-[11px] text-muted-foreground capitalize line-clamp-1">
            {design.color_name || design.finish_type} {design.finish_type !== (design.color_name || '').toLowerCase() && `• ${design.finish_type}`}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 bg-[#0F0F14] border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-[10px] h-7 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 bg-[#0F0F14] border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-[10px] h-7 transition-all"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Image className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="bg-[#0F0F14] border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-[10px] h-7 px-2 transition-all"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Save className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
